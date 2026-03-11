package com.daniele.url_shortener.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Vorname ist erforderlich")
        @Size(max = 100, message = "Vorname darf maximal 100 Zeichen haben")
        String firstName,

        @NotBlank(message = "Nachname ist erforderlich")
        @Size(max = 100, message = "Nachname darf maximal 100 Zeichen haben")
        String lastName,

        @NotBlank(message = "E-Mail ist erforderlich")
        @Email(message = "E-Mail ist ungültig")
        @Pattern(
                regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}$",
                message = "E-Mail muss eine gueltige Domain-Endung haben"
        )
        String email,

        @NotBlank(message = "Passwort ist erforderlich")
        @Size(min = 8, max = 100, message = "Passwort muss zwischen 8 und 100 Zeichen lang sein")
        String password
) {
}
