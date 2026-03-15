package com.daniele.url_shortener.auth;

import com.daniele.url_shortener.auth.dto.CurrentUserResponse;
import com.daniele.url_shortener.auth.dto.GoogleAuthRequest;
import com.daniele.url_shortener.auth.dto.LoginRequest;
import com.daniele.url_shortener.auth.dto.RegisterRequest;
import com.daniele.url_shortener.auth.exception.EmailAlreadyExistsException;
import com.daniele.url_shortener.auth.exception.GoogleAuthException;
import com.daniele.url_shortener.auth.exception.GoogleProfileIncompleteException;
import com.daniele.url_shortener.auth.exception.InvalidCredentialsException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.daniele.url_shortener.link.exception.UserNotFoundException;
import com.daniele.url_shortener.security.AuthenticatedUser;
import com.daniele.url_shortener.user.User;
import com.daniele.url_shortener.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient = RestClient.create();

    @Value("${app.google.client-id:}")
    private String googleClientId;

    @Transactional
    public Long register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        String normalizedFirstName = normalizeName(request.firstName());
        String normalizedLastName = normalizeName(request.lastName());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException("E-Mail bereits vergeben. Bitte loggen Sie sich ein.");
        }

        User user = new User();
        user.setFirstName(normalizedFirstName);
        user.setLastName(normalizedLastName);
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        User savedUser = userRepository.save(user);
        return savedUser.getUserId();
    }

    @Transactional(readOnly = true)
    public User login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new InvalidCredentialsException("E-Mail oder Passwort ist falsch"));

        boolean passwordMatches = passwordEncoder.matches(request.password(), user.getPasswordHash());
        if (!passwordMatches) {
            throw new InvalidCredentialsException("E-Mail oder Passwort ist falsch");
        }

        return user;
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(AuthenticatedUser authenticatedUser) {
        User user = userRepository.findById(authenticatedUser.userId())
                .orElseThrow(() -> new UserNotFoundException("User wurde nicht gefunden"));

        return new CurrentUserResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail()
        );
    }

    @Transactional(readOnly = true)
    public boolean isEmailAvailable(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        return !userRepository.existsByEmail(normalizedEmail);
    }

    @Transactional
    public User loginWithGoogle(GoogleAuthRequest request) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new GoogleAuthException("Google Login ist nicht konfiguriert");
        }

        GoogleTokenInfo tokenInfo = verifyGoogleIdToken(request.idToken().trim());

        if (!tokenInfo.emailVerified()) {
            throw new GoogleAuthException("Google E-Mail ist nicht verifiziert");
        }

        String normalizedEmail = tokenInfo.email().trim().toLowerCase();
        Optional<User> existingUserOptional = userRepository.findByEmail(normalizedEmail);
        if (existingUserOptional.isPresent()) {
            User existingUser = existingUserOptional.get();
            String existingGoogleSub = existingUser.getGoogleSub();

            if (existingGoogleSub == null || existingGoogleSub.isBlank()) {
                existingUser.setGoogleSub(tokenInfo.sub());
                return userRepository.save(existingUser);
            }

            if (!existingGoogleSub.equals(tokenInfo.sub())) {
                throw new GoogleAuthException("Google-Login kann nicht zugeordnet werden");
            }

            return existingUser;
        }

        String firstNameCandidate = pickName(request.firstName());
        String lastNameCandidate = pickName(request.lastName());

        if (firstNameCandidate == null || lastNameCandidate == null) {
            throw new GoogleProfileIncompleteException("Bitte Vor- und Nachname ergänzen");
        }

        User newUser = new User();
        newUser.setFirstName(normalizeName(firstNameCandidate));
        newUser.setLastName(normalizeName(lastNameCandidate));
        newUser.setEmail(normalizedEmail);
        newUser.setGoogleSub(tokenInfo.sub());
        newUser.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        return userRepository.save(newUser);
    }

    private String normalizeName(String rawName) {
        String trimmed = rawName.trim();
        StringBuilder result = new StringBuilder(trimmed.length());
        boolean uppercaseNext = true;

        for (int i = 0; i < trimmed.length(); i++) {
            char current = trimmed.charAt(i);

            if (Character.isLetter(current)) {
                result.append(
                        uppercaseNext ? Character.toUpperCase(current) : Character.toLowerCase(current)
                );
                uppercaseNext = false;
                continue;
            }

            result.append(current);
            uppercaseNext = current == ' ' || current == '-';
        }

        return result.toString();
    }

    private GoogleTokenInfo verifyGoogleIdToken(String idToken) {
        try {
            String rawResponse = restClient.get()
                    .uri("https://oauth2.googleapis.com/tokeninfo?id_token={idToken}", idToken)
                    .retrieve()
                    .body(String.class);

            if (rawResponse == null || rawResponse.isBlank()) {
                throw new GoogleAuthException("Ungültige Google-Antwort");
            }

            Map<String, Object> payload = objectMapper.readValue(
                    rawResponse,
                    new TypeReference<Map<String, Object>>() {
                    }
            );

            String audience = asString(payload.get("aud"));
            if (!googleClientId.equals(audience)) {
                throw new GoogleAuthException("Ungültige Google Audience");
            }

            String issuer = asString(payload.get("iss"));
            boolean validIssuer =
                    "https://accounts.google.com".equals(issuer) || "accounts.google.com".equals(issuer);
            if (!validIssuer) {
                throw new GoogleAuthException("Ungültiger Google Issuer");
            }

            String email = asString(payload.get("email"));
            String sub = asString(payload.get("sub"));
            if (email == null || sub == null) {
                throw new GoogleAuthException("Google-Profil ist unvollständig");
            }

            boolean emailVerified = "true".equalsIgnoreCase(asString(payload.get("email_verified")));
            String givenName = asString(payload.get("given_name"));
            String familyName = asString(payload.get("family_name"));

            return new GoogleTokenInfo(email, sub, emailVerified, givenName, familyName);
        } catch (RestClientException ex) {
            throw new GoogleAuthException("Google Token konnte nicht verifiziert werden");
        } catch (Exception ex) {
            throw new GoogleAuthException("Google Token ist ungültig");
        }
    }

    private String pickName(String preferred) {
        if (preferred != null && !preferred.trim().isBlank()) {
            return preferred.trim();
        }
        return null;
    }

    private String asString(Object value) {
        if (value == null) return null;
        return String.valueOf(value);
    }

    private record GoogleTokenInfo(
            String email,
            String sub,
            boolean emailVerified,
            String givenName,
            String familyName
    ) {
    }
}
