package com.daniele.url_shortener.link.dto;

import java.time.LocalDateTime;

public record LinkSummaryResponse(
        Long linkId,
        String originalUrl,
        String shortCode,
        String shortUrl,
        Long clickCount,
        LocalDateTime createdAt
) {
}
