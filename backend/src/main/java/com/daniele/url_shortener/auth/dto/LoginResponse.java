package com.daniele.url_shortener.auth.dto;

public record LoginResponse(
        Long userId,
        String message
) {
}
