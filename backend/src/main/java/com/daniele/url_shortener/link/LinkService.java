package com.daniele.url_shortener.link;

import com.daniele.url_shortener.link.dto.CreateLinkRequest;
import com.daniele.url_shortener.link.dto.CreateLinkResponse;
import com.daniele.url_shortener.link.dto.LinkSummaryResponse;
import com.daniele.url_shortener.link.exception.InvalidUrlException;
import com.daniele.url_shortener.link.exception.ShortCodeNotFoundException;
import com.daniele.url_shortener.link.exception.UserNotFoundException;
import com.daniele.url_shortener.user.User;
import com.daniele.url_shortener.user.UserRepository;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.SecureRandom;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LinkService {

    private static final String ALPHANUMERIC = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final int SHORT_CODE_LENGTH = 6;
    private static final int MAX_GENERATION_ATTEMPTS = 10;

    private final LinkRepository linkRepository;
    private final UserRepository userRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Transactional
    public CreateLinkResponse createShortLink(CreateLinkRequest request) {
        String normalizedUrl = normalizeAndValidateUrl(request.originalUrl());

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new UserNotFoundException("User wurde nicht gefunden"));

        Link link = new Link();
        link.setOriginalUrl(normalizedUrl);
        link.setShortCode(generateUniqueShortCode());
        link.setUser(user);

        Link saved = linkRepository.save(link);

        return new CreateLinkResponse(
                saved.getLinkId(),
                saved.getOriginalUrl(),
                saved.getShortCode(),
                buildShortUrl(saved.getShortCode()),
                saved.getClickCount(),
                saved.getCreatedAt()
        );
    }

    @Transactional
    public String resolveOriginalUrlAndIncreaseClickCount(String shortCode) {
        Link link = linkRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new ShortCodeNotFoundException("Short-Code wurde nicht gefunden"));

        Long currentCount = link.getClickCount() == null ? 0L : link.getClickCount();
        link.setClickCount(currentCount + 1);

        return link.getOriginalUrl();
    }

    @Transactional(readOnly = true)
    public List<LinkSummaryResponse> getLinksForUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException("User wurde nicht gefunden");
        }

        return linkRepository.findAllByUserUserIdOrderByCreatedAtDesc(userId).stream()
                .map(link -> new LinkSummaryResponse(
                        link.getLinkId(),
                        link.getOriginalUrl(),
                        link.getShortCode(),
                        buildShortUrl(link.getShortCode()),
                        link.getClickCount(),
                        link.getCreatedAt()
                ))
                .toList();
    }

    private String normalizeAndValidateUrl(String rawUrl) {
        String trimmed = rawUrl.trim();
        String prepared = trimmed;

        // Wenn kein Schema vorhanden ist, setzen wir automatisch http://
        boolean hasScheme = prepared.matches("^[a-zA-Z][a-zA-Z0-9+.-]*://.*");
        if (!hasScheme) {
            if (prepared.regionMatches(true, 0, "www.", 0, 4)) {
                prepared = prepared.substring(4);
            }
            prepared = "http://" + prepared;
        }

        try {
            URI uri = new URI(prepared);
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                throw new InvalidUrlException("URL muss mit http:// oder https:// beginnen");
            }

            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                throw new InvalidUrlException("URL ist ungueltig");
            }

            String normalizedHost = host.toLowerCase();
            if (normalizedHost.startsWith("www.")) {
                normalizedHost = normalizedHost.substring(4);
            }

            // Domain muss einen Punkt enthalten (z.B. youtube.com)
            if (!normalizedHost.contains(".")
                    || normalizedHost.startsWith(".")
                    || normalizedHost.endsWith(".")) {
                throw new InvalidUrlException("Bitte gib eine gueltige Domain ein (z.B. youtube.com)");
            }

            URI normalizedUri = new URI(
                    scheme.toLowerCase(),
                    uri.getUserInfo(),
                    normalizedHost,
                    uri.getPort(),
                    uri.getPath(),
                    uri.getQuery(),
                    uri.getFragment()
            );
            return normalizedUri.toString();
        } catch (URISyntaxException e) {
            throw new InvalidUrlException("URL ist ungueltig");
        }
    }

    private String generateUniqueShortCode() {
        for (int attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
            String candidate = randomShortCode();
            if (!linkRepository.existsByShortCode(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Short-Code konnte nicht erzeugt werden");
    }

    private String randomShortCode() {
        StringBuilder builder = new StringBuilder(SHORT_CODE_LENGTH);
        for (int i = 0; i < SHORT_CODE_LENGTH; i++) {
            int index = secureRandom.nextInt(ALPHANUMERIC.length());
            builder.append(ALPHANUMERIC.charAt(index));
        }
        return builder.toString();
    }

    private String buildShortUrl(String shortCode) {
        return baseUrl + "/" + shortCode;
    }
}
