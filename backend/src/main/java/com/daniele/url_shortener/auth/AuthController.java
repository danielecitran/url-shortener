package com.daniele.url_shortener.auth;

import com.daniele.url_shortener.auth.dto.LoginRequest;
import com.daniele.url_shortener.auth.dto.LoginResponse;
import com.daniele.url_shortener.auth.dto.RegisterRequest;
import com.daniele.url_shortener.auth.dto.RegisterResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        Long userId = authService.register(request);
        RegisterResponse response = new RegisterResponse(userId, "Registrierung erfolgreich");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        Long userId = authService.login(request);
        LoginResponse response = new LoginResponse(userId, "Login erfolgreich");
        return ResponseEntity.ok(response);
    }
}
