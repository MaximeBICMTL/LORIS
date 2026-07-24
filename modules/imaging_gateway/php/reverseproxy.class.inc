<?php declare(strict_types=1);

/**
 * Implements the Imaging Gateway's streaming reverse proxy.
 *
 * PHP Version 8
 *
 * @category Imaging
 * @package  ImagingGateway
 * @author   Loris Team <loris-dev@bic.mni.mcgill.ca>
 * @license  http://www.gnu.org/licenses/gpl-3.0.txt GPLv3
 * @link     https://www.github.com/aces/Loris/
 */

namespace LORIS\imaging_gateway;

use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Uri;
use Psr\Http\Message\MessageInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UriInterface;
use Psr\Log\LoggerInterface;

/**
 * Forward requests to a fixed internal service without buffering their bodies.
 *
 * @category Imaging
 * @package  ImagingGateway
 * @author   Loris Team <loris-dev@bic.mni.mcgill.ca>
 * @license  http://www.gnu.org/licenses/gpl-3.0.txt GPLv3
 * @link     https://www.github.com/aces/Loris/
 */
class ReverseProxy
{
    /**
     * Headers which apply only to one HTTP connection and must not be proxied.
     */
    private const HOP_BY_HOP_HEADERS = [
        'connection',
        'keep-alive',
        'proxy-authenticate',
        'proxy-authorization',
        'te',
        'trailer',
        'transfer-encoding',
        'upgrade',
    ];

    /**
     * Construct a reverse proxy for a fixed upstream service.
     *
     * @param ClientInterface $client          Streaming HTTP client.
     * @param string          $upstreamBaseURI Fixed upstream service URI.
     * @param float           $connectTimeout  Upstream connection timeout in
     *                                         seconds.
     * @param LoggerInterface $logger          LORIS request logger.
     */
    public function __construct(
        private ClientInterface $client,
        private string $upstreamBaseURI,
        private float $connectTimeout,
        private LoggerInterface $logger,
    ) {
    }

    /**
     * Forward a request to the configured upstream service.
     *
     * @param ServerRequestInterface $request     Incoming public request.
     * @param UriInterface           $upstreamURI Path relative to the gateway.
     * @param string                 $bearerToken Authentication token for the
     *                                            upstream service.
     *
     * @return ResponseInterface Streaming upstream response or a gateway error.
     */
    public function forward(
        ServerRequestInterface $request,
        UriInterface $upstreamURI,
        string $bearerToken,
    ): ResponseInterface {
        $targetURI = $this->_makeTargetURI($upstreamURI);
        $headers   = $this->_makeUpstreamHeaders(
            $request,
            $upstreamURI,
            $bearerToken,
        );

        $upstreamRequest = new Request(
            $request->getMethod(),
            $targetURI,
            $headers,
            $request->getBody(),
            '1.1',
        );

        try {
            $response = $this->client->send(
                $upstreamRequest,
                [
                    'allow_redirects' => false,
                    'connect_timeout' => $this->connectTimeout,
                    'http_errors'     => false,
                    'stream'          => true,
                    // Large downloads and TUS uploads must not be terminated by
                    // a generic HTTP client timeout.
                    'timeout'         => 0,
                ],
            );
        } catch (GuzzleException $exception) {
            $this->logger->error(
                'Unable to contact the internal imaging service.',
                ['exception' => $exception],
            );
            return new \LORIS\Http\Response\JsonResponse(
                ['error' => 'Unable to contact the internal imaging service.'],
                502,
            );
        }

        $response = $this->_removeHopByHopHeaders($response);
        $response = $response->withoutHeader('Set-Cookie');

        return $this->_rewriteUpstreamLocation(
            $response,
            $request,
            $upstreamURI,
        );
    }

    /**
     * Create the absolute URI sent to the upstream service.
     *
     * @param UriInterface $route Path and query relative to the gateway.
     *
     * @return UriInterface Absolute upstream URI.
     */
    private function _makeTargetURI(UriInterface $route): UriInterface
    {
        $target   = new Uri($this->upstreamBaseURI);
        $basePath = rtrim($target->getPath(), '/');
        $path     = $basePath . '/' . ltrim($route->getPath(), '/');

        return $target
            ->withPath($path)
            ->withQuery($route->getQuery())
            ->withFragment('');
    }

    /**
     * Create safe upstream headers while preserving application headers.
     *
     * This deny-list approach preserves Tus headers and future endpoint-specific
     * headers while removing credentials and connection-specific values.
     *
     * @param ServerRequestInterface $request     Incoming public request.
     * @param UriInterface           $upstreamURI Path relative to the gateway.
     * @param string                 $bearerToken Upstream authentication token.
     *
     * @return array<string, string[]> Headers for the upstream request.
     */
    private function _makeUpstreamHeaders(
        ServerRequestInterface $request,
        UriInterface $upstreamURI,
        string $bearerToken,
    ): array {
        $blocked = array_fill_keys(self::HOP_BY_HOP_HEADERS, true);
        $blocked = array_merge(
            $blocked,
            array_fill_keys(
                $this->_getConnectionHeaderNames($request),
                true,
            ),
            [
                'authorization'      => true,
                'cookie'             => true,
                'host'               => true,
                'x-forwarded-for'    => true,
                'x-forwarded-host'   => true,
                'x-forwarded-prefix' => true,
                'x-forwarded-proto'  => true,
            ],
        );

        $headers = [];
        foreach ($request->getHeaders() as $name => $values) {
            if (!isset($blocked[strtolower($name)])) {
                $headers[$name] = $values;
            }
        }

        $headers['Authorization'] = ['Bearer ' . $bearerToken];

        $remoteAddress = $request->getServerParams()['REMOTE_ADDR'] ?? '';
        if (is_string($remoteAddress) && $remoteAddress !== '') {
            $headers['X-Forwarded-For'] = [$remoteAddress];
        }

        $publicURI = $request->getUri();
        if ($publicURI->getAuthority() !== '') {
            $headers['X-Forwarded-Host'] = [$publicURI->getAuthority()];
        }
        if ($publicURI->getScheme() !== '') {
            $headers['X-Forwarded-Proto'] = [$publicURI->getScheme()];
        }

        $headers['X-Forwarded-Prefix'] = [
            $this->_getPublicGatewayPath($request, $upstreamURI),
        ];

        return $headers;
    }

    /**
     * Remove hop-by-hop headers from an upstream response.
     *
     * @param ResponseInterface $response Response whose headers should be
     *                                    filtered.
     *
     * @return ResponseInterface Filtered response.
     */
    private function _removeHopByHopHeaders(
        ResponseInterface $response,
    ): ResponseInterface {
        $headers = array_merge(
            self::HOP_BY_HOP_HEADERS,
            $this->_getConnectionHeaderNames($response),
        );

        foreach (array_unique($headers) as $header) {
            $response = $response->withoutHeader($header);
        }

        return $response;
    }

    /**
     * Read additional hop-by-hop header names from the Connection header.
     *
     * @param MessageInterface $message HTTP message.
     *
     * @return string[] Lowercase header names.
     */
    private function _getConnectionHeaderNames(
        MessageInterface $message,
    ): array {
        $headers = [];
        foreach (explode(',', $message->getHeaderLine('Connection')) as $name) {
            $name = strtolower(trim($name));
            if ($name !== '') {
                $headers[] = $name;
            }
        }
        return $headers;
    }

    /**
     * Rewrite internal redirect locations to the public gateway route.
     *
     * @param ResponseInterface      $response    Upstream response.
     * @param ServerRequestInterface $request     Incoming public request.
     * @param UriInterface           $upstreamURI Path relative to the gateway.
     *
     * @return ResponseInterface Response with a safe public Location header.
     */
    private function _rewriteUpstreamLocation(
        ResponseInterface $response,
        ServerRequestInterface $request,
        UriInterface $upstreamURI,
    ): ResponseInterface {
        if (!$response->hasHeader('Location')) {
            return $response;
        }

        $location = new Uri($response->getHeaderLine('Location'));
        if ($location->getHost() !== '') {
            $upstream = new Uri($this->upstreamBaseURI);
            if (!$this->_hasSameOrigin($location, $upstream)) {
                return $response;
            }
        } elseif (!str_starts_with($location->getPath(), '/')) {
            return $response;
        }

        $publicURI = $request->getUri();
        $publicURI = $publicURI
            ->withPath(
                $this->_getPublicGatewayPath($request, $upstreamURI)
                . '/' . ltrim($location->getPath(), '/'),
            )
            ->withQuery($location->getQuery())
            ->withFragment($location->getFragment());

        return $response->withHeader('Location', (string) $publicURI);
    }

    /**
     * Find the public path prefix occupied by the gateway module.
     *
     * @param ServerRequestInterface $request     Incoming public request.
     * @param UriInterface           $upstreamURI Path relative to the gateway.
     *
     * @return string Public gateway path, including an installation base path.
     */
    private function _getPublicGatewayPath(
        ServerRequestInterface $request,
        UriInterface $upstreamURI,
    ): string {
        $publicPath = $request->getUri()->getPath();
        $routePath  = $upstreamURI->getPath();

        if ($routePath !== '' && str_ends_with($publicPath, $routePath)) {
            return '/' . trim(
                substr($publicPath, 0, -strlen($routePath)),
                '/',
            );
        }

        return '/imaging_gateway';
    }

    /**
     * Determine whether two URIs identify the same upstream origin.
     *
     * @param UriInterface $left  First URI.
     * @param UriInterface $right Second URI.
     *
     * @return bool Whether the scheme, host, and port match.
     */
    private function _hasSameOrigin(
        UriInterface $left,
        UriInterface $right,
    ): bool {
        return strtolower($left->getScheme()) === strtolower($right->getScheme())
            && strtolower($left->getHost()) === strtolower($right->getHost())
            && $left->getPort() === $right->getPort();
    }
}
