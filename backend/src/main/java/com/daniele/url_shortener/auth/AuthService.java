package com.daniele.url_shortener.auth;

import com.daniele.url_shortener.auth.dto.CurrentUserResponse;
import com.daniele.url_shortener.auth.dto.LoginRequest;
import com.daniele.url_shortener.auth.dto.RegisterRequest;
import com.daniele.url_shortener.auth.exception.EmailAlreadyExistsException;
import com.daniele.url_shortener.auth.exception.InvalidCredentialsException;
import com.daniele.url_shortener.link.exception.UserNotFoundException;
import com.daniele.url_shortener.security.AuthenticatedUser;
import com.daniele.url_shortener.user.User;
import com.daniele.url_shortener.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Long register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException("E-Mail bereits vergeben. Bitte loggen Sie sich ein.");
        }

        User user = new User();
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
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
}
