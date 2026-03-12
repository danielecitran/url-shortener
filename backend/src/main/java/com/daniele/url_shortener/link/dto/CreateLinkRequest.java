package com.daniele.url_shortener.link.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateLinkRequest(
        @NotBlank(message = "originalUrl ist erforderlich")
        String originalUrl
) {
}
