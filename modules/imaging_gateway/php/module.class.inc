<?php declare(strict_types=1);

/**
 * Implements the gateway to the internal LORIS imaging service.
 *
 * PHP Version 8
 *
 * @category Imaging
 * @package  Main
 * @author   Loris Team <loris-dev@bic.mni.mcgill.ca>
 * @license  http://www.gnu.org/licenses/gpl-3.0.txt GPLv3
 * @link     https://www.github.com/aces/Loris/
 */

namespace LORIS\imaging_gateway;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UriInterface;

/**
 * Route authenticated requests to the internal LORIS imaging service.
 *
 * This module intentionally has no menu entry. Python modules remain
 * responsible for endpoint-specific authorization.
 *
 * @category Imaging
 * @package  Main
 * @author   Loris Team <loris-dev@bic.mni.mcgill.ca>
 * @license  http://www.gnu.org/licenses/gpl-3.0.txt GPLv3
 * @link     https://www.github.com/aces/Loris/
 */
class Module extends \Module
{
    /**
     * {@inheritDoc}
     *
     * @return string Human-readable module name.
     */
    public function getLongName(): string
    {
        return 'Imaging Gateway';
    }

    /**
     * Forward an authenticated request without invoking normal page routing.
     *
     * @param ServerRequestInterface $request Incoming gateway request.
     *
     * @return ResponseInterface Streaming upstream response.
     */
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $route = $request->getAttribute('unhandledURI');
        if (!$route instanceof UriInterface) {
            return new \LORIS\Http\Response\JsonResponse(
                ['error' => 'Unable to determine the imaging service route.'],
                500,
            );
        }

        $user = $request->getAttribute('user');
        if (!$user instanceof \User || $user instanceof \LORIS\AnonymousUser) {
            return new \LORIS\Http\Response\JSON\Unauthorized(
                'Authentication is required.',
            );
        }

        $token = $this->createAccessToken($user);
        if ($token === '') {
            return new \LORIS\Http\Response\JsonResponse(
                ['error' => 'Unable to authenticate with the imaging service.'],
                500,
            );
        }

        try {
            $proxy = $this->createProxy();
        } catch (\ConfigurationException | \InvalidArgumentException $exception) {
            $this->logger->error(
                'The Imaging Gateway configuration is invalid.',
                ['exception' => $exception],
            );
            return new \LORIS\Http\Response\JsonResponse(
                ['error' => self::CONFIGURATION_ERROR],
                500,
            );
        }

        return $proxy->forward($request, $route, $token);
    }

    /**
     * Create the streaming reverse proxy.
     *
     * @return ReverseProxy Imaging service proxy.
     *
     * @throws \ConfigurationException For missing configuration.
     * @throws \InvalidArgumentException For invalid configuration values.
     */
    protected function createProxy(): ReverseProxy
    {
        $config         = $this->loris->getConfiguration();
        $upstreamURI    = $config->getSetting(
            'imaging_gateway_upstream_url',
        );
        $connectTimeout = $config->getSetting(
            'imaging_gateway_connect_timeout_seconds',
        );

        if (!is_string($upstreamURI) || trim($upstreamURI) === '') {
            throw new \InvalidArgumentException(
                'The Imaging Gateway upstream URL must not be empty.',
            );
        }

        $uri = new \GuzzleHttp\Psr7\Uri(trim($upstreamURI));
        if (!in_array(strtolower($uri->getScheme()), ['http', 'https'], true)
            || $uri->getHost() === ''
        ) {
            throw new \InvalidArgumentException(
                'The Imaging Gateway upstream URL must be an HTTP(S) URL.',
            );
        }

        if (!is_numeric($connectTimeout) || (float) $connectTimeout <= 0) {
            throw new \InvalidArgumentException(
                'The Imaging Gateway connection timeout must be positive.',
            );
        }

        return new ReverseProxy(
            new \GuzzleHttp\Client(),
            (string) $uri,
            (float) $connectTimeout,
            $this->logger,
        );
    }

    /**
     * Create a signed token identifying the current LORIS user.
     *
     * @param \User $user Authenticated LORIS user.
     *
     * @return string Encoded JWT, or an empty string for an invalid JWT key.
     */
    protected function createAccessToken(\User $user): string
    {
        $api = $this->loris->getModule('api');
        $api->registerAutoloader();

        $login = new \LORIS\api\Endpoints\Login($this->loris);
        return $login->getEncodedToken($user->getUsername());
    }
}
