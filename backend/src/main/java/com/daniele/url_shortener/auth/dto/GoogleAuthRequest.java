package com.daniele.url_shortener.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequest(
        @NotBlank(message = "Google ID Token ist erforderlich")
        String idToken,
        String firstName,
        String lastName,
        Boolean rememberMe
) {
}
