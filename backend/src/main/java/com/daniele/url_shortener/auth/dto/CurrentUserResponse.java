package com.daniele.url_shortener.auth.dto;

public record CurrentUserResponse(
        Long userId,
        String firstName,
        String lastName,
        String email
) {
}
