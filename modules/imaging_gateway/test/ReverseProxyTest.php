<?php declare(strict_types=1);

/**
 * Unit tests for the streaming reverse proxy.
 *
 * PHP Version 8
 *
 * @category Tests
 * @package  Test
 * @author   Loris Team <loris-dev@bic.mni.mcgill.ca>
 * @license  http://www.gnu.org/licenses/gpl-3.0.txt GPLv3
 * @link     https://www.github.com/aces/Loris/
 */

namespace LORIS\imaging_gateway\Test;

require_once __DIR__ . '/../php/reverseproxy.class.inc';

use GuzzleHttp\ClientInterface;
use GuzzleHttp\Psr7\Response;
use GuzzleHttp\Psr7\ServerRequest;
use GuzzleHttp\Psr7\Uri;
use GuzzleHttp\Psr7\Utils;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\RequestInterface;
use Psr\Log\NullLogger;

/**
 * Test the streaming and header handling of the imaging gateway proxy.
 *
 * @category Tests
 * @package  Test
 * @author   Loris Team <loris-dev@bic.mni.mcgill.ca>
 * @license  http://www.gnu.org/licenses/gpl-3.0.txt GPLv3
 * @link     https://www.github.com/aces/Loris/
 */
final class ReverseProxyTest extends TestCase
{
    /**
     * Ensure Tus request and response streams pass through without buffering.
     *
     * @return void
     */
    public function testForwardsTusStreamsAndHeaders(): void
    {
        $requestBody  = Utils::streamFor('a file chunk');
        $responseBody = Utils::streamFor('next chunk');
        $client       = $this->createMock(ClientInterface::class);

        $client->expects($this->once())
            ->method('send')
            ->willReturnCallback(
                function (RequestInterface $request, array $options) use (
                    $requestBody,
                    $responseBody,
                ): Response {
                    $this->assertSame('PATCH', $request->getMethod());
                    $this->assertSame(
                        'http://127.0.0.1:8000/ephys/12/upload?part=2',
                        (string) $request->getUri(),
                    );
                    $this->assertSame($requestBody, $request->getBody());
                    $this->assertSame('1.1', $request->getProtocolVersion());
                    $this->assertSame(
                        'Bearer signed-token',
                        $request->getHeaderLine('Authorization'),
                    );
                    $this->assertSame(
                        '1.0.0',
                        $request->getHeaderLine('Tus-Resumable'),
                    );
                    $this->assertSame(
                        '4096',
                        $request->getHeaderLine('Upload-Offset'),
                    );
                    $this->assertFalse($request->hasHeader('Cookie'));
                    $this->assertFalse($request->hasHeader('Keep-Alive'));
                    $this->assertSame(
                        '192.0.2.10',
                        $request->getHeaderLine('X-Forwarded-For'),
                    );
                    $this->assertSame(
                        '/loris/imaging_gateway',
                        $request->getHeaderLine('X-Forwarded-Prefix'),
                    );
                    $this->assertFalse($options['allow_redirects']);
                    $this->assertSame(5.0, $options['connect_timeout']);
                    $this->assertTrue($options['stream']);
                    $this->assertSame(0, $options['timeout']);

                    return new Response(
                        204,
                        [
                            'Connection'    => 'Keep-Alive, X-Internal',
                            'Keep-Alive'    => 'timeout=5',
                            'Set-Cookie'    => 'internal=true',
                            'Tus-Resumable' => '1.0.0',
                            'Upload-Offset' => '8192',
                            'X-Internal'    => 'removed',
                        ],
                        $responseBody,
                    );
                },
            );

        $request = new ServerRequest(
            'PATCH',
            'https://loris.example/loris/imaging_gateway/ephys/12/upload?part=2',
            [
                'Authorization'   => 'incoming browser credentials',
                'Connection'      => 'Keep-Alive',
                'Cookie'          => 'PHPSESSID=secret',
                'Keep-Alive'      => 'timeout=5',
                'Tus-Resumable'   => '1.0.0',
                'Upload-Offset'   => '4096',
                'X-Forwarded-For' => 'spoofed',
            ],
            $requestBody,
            '2.0',
            ['REMOTE_ADDR' => '192.0.2.10'],
        );

        $response = $this->_createProxy($client)->forward(
            $request,
            new Uri('/ephys/12/upload?part=2'),
            'signed-token',
        );

        $this->assertSame($responseBody, $response->getBody());
        $this->assertSame('1.0.0', $response->getHeaderLine('Tus-Resumable'));
        $this->assertSame('8192', $response->getHeaderLine('Upload-Offset'));
        $this->assertFalse($response->hasHeader('Connection'));
        $this->assertFalse($response->hasHeader('Keep-Alive'));
        $this->assertFalse($response->hasHeader('Set-Cookie'));
        $this->assertFalse($response->hasHeader('X-Internal'));
    }

    /**
     * Ensure internal absolute redirects remain behind the public gateway.
     *
     * @return void
     */
    public function testRewritesInternalRedirectLocation(): void
    {
        $client = $this->createMock(ClientInterface::class);
        $client->expects($this->once())
            ->method('send')
            ->willReturn(
                new Response(
                    201,
                    [
                        'Location' => 'http://127.0.0.1:8000/ephys/upload/abc',
                    ],
                ),
            );

        $request = new ServerRequest(
            'POST',
            'https://loris.example/loris/imaging_gateway/ephys/upload',
        );

        $response = $this->_createProxy($client)->forward(
            $request,
            new Uri('/ephys/upload'),
            'signed-token',
        );

        $this->assertSame(
            'https://loris.example/loris/imaging_gateway/ephys/upload/abc',
            $response->getHeaderLine('Location'),
        );
    }

    /**
     * Create a proxy using the supplied mock client.
     *
     * @param ClientInterface $client Mock HTTP client.
     *
     * @return \LORIS\imaging_gateway\ReverseProxy Proxy under test.
     */
    private function _createProxy(
        ClientInterface $client,
    ): \LORIS\imaging_gateway\ReverseProxy {
        return new \LORIS\imaging_gateway\ReverseProxy(
            $client,
            'http://127.0.0.1:8000',
            5.0,
            new NullLogger(),
        );
    }
}
