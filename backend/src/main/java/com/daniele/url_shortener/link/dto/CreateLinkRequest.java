package com.daniele.url_shortener.link.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateLinkRequest(
        @NotNull(message = "userId ist erforderlich")
        Long userId,

        @NotBlank(message = "originalUrl ist erforderlich")
        String originalUrl
) {
}
