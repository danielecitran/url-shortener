package com.daniele.url_shortener.auth.dto;

public record RegisterResponse(
        Long userId,
        String message
) {
}
