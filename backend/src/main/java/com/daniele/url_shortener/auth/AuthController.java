package com.daniele.url_shortener.auth;

import com.daniele.url_shortener.auth.dto.CurrentUserResponse;
import com.daniele.url_shortener.auth.dto.LoginRequest;
import com.daniele.url_shortener.auth.dto.LoginResponse;
import com.daniele.url_shortener.auth.dto.RegisterRequest;
import com.daniele.url_shortener.auth.dto.RegisterResponse;
import com.daniele.url_shortener.security.AuthenticatedUser;
import com.daniele.url_shortener.security.JwtService;
import com.daniele.url_shortener.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        Long userId = authService.register(request);
        RegisterResponse response = new RegisterResponse(userId, "Registrierung erfolgreich");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> me(@AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        CurrentUserResponse response = authService.getCurrentUser(authenticatedUser);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = authService.login(request);
        String token = jwtService.generateToken(user.getUserId(), user.getEmail());

        ResponseCookie authCookie = ResponseCookie.from(jwtService.getCookieName(), token)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .sameSite("Lax")
                .maxAge(jwtService.getExpirationSeconds())
                .build();

        LoginResponse response = new LoginResponse(user.getUserId(), "Login erfolgreich");
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookie.toString())
                .body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie deleteCookie = ResponseCookie.from(jwtService.getCookieName(), "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .sameSite("Lax")
                .maxAge(0)
                .build();

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .build();
    }
}
