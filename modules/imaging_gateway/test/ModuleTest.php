<?php declare(strict_types=1);

/**
 * Unit tests for the Imaging Gateway module configuration.
 *
 * PHP Version 8
 *
 * @category Imaging
 * @package  ImagingGateway
 * @author   Loris Team <loris-dev@bic.mni.mcgill.ca>
 * @license  http://www.gnu.org/licenses/gpl-3.0.txt GPLv3
 * @link     https://www.github.com/aces/Loris/
 */

namespace LORIS\imaging_gateway\Test;

require_once __DIR__ . '/../php/reverseproxy.class.inc';
require_once __DIR__ . '/../php/module.class.inc';

use LORIS\imaging_gateway\Module;
use LORIS\imaging_gateway\ReverseProxy;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;

/**
 * Expose proxy construction for focused configuration tests.
 *
 * @category Imaging
 * @package  ImagingGateway
 * @author   Loris Team <loris-dev@bic.mni.mcgill.ca>
 * @license  http://www.gnu.org/licenses/gpl-3.0.txt GPLv3
 * @link     https://www.github.com/aces/Loris/
 */
final class TestableModule extends Module
{
    /**
     * Create the configured proxy.
     *
     * @return ReverseProxy Configured proxy.
     */
    public function getProxy(): ReverseProxy
    {
        return $this->createProxy();
    }
}

/**
 * Test Imaging Gateway configuration parsing and validation.
 *
 * @category Imaging
 * @package  ImagingGateway
 * @author   Loris Team <loris-dev@bic.mni.mcgill.ca>
 * @license  http://www.gnu.org/licenses/gpl-3.0.txt GPLv3
 * @link     https://www.github.com/aces/Loris/
 */
final class ModuleTest extends TestCase
{
    /**
     * Ensure valid database settings construct the proxy.
     *
     * @return void
     */
    public function testCreatesProxyFromConfiguration(): void
    {
        $upstreamURL = 'http://imaging.internal:8000';
        $module      = $this->_createModule(
            [
                'imaging_gateway_upstream_url'            => $upstreamURL,
                'imaging_gateway_connect_timeout_seconds' => '2.5',
            ],
        );

        $this->assertInstanceOf(ReverseProxy::class, $module->getProxy());
    }

    /**
     * Reject upstream URLs that cannot identify an HTTP service.
     *
     * @return void
     */
    public function testRejectsInvalidUpstreamURL(): void
    {
        $upstreamURL = 'file:///internal/service';
        $module      = $this->_createModule(
            [
                'imaging_gateway_upstream_url'            => $upstreamURL,
                'imaging_gateway_connect_timeout_seconds' => '5',
            ],
        );

        $this->expectException(\InvalidArgumentException::class);
        $module->getProxy();
    }

    /**
     * Reject non-positive connection timeouts.
     *
     * @return void
     */
    public function testRejectsInvalidConnectionTimeout(): void
    {
        $module = $this->_createModule(
            [
                'imaging_gateway_upstream_url'            => 'http://127.0.0.1:8000',
                'imaging_gateway_connect_timeout_seconds' => '0',
            ],
        );

        $this->expectException(\InvalidArgumentException::class);
        $module->getProxy();
    }

    /**
     * Create a module backed by the supplied configuration values.
     *
     * @param array<string, mixed> $values Configuration values by setting name.
     *
     * @return TestableModule Module under test.
     */
    private function _createModule(array $values): TestableModule
    {
        $config = $this->createStub(\NDB_Config::class);
        $config->method('getSetting')->willReturnCallback(
            static fn (string $name) => $values[$name] ?? null,
        );

        $loris = $this->createStub(\LORIS\LorisInstance::class);
        $loris->method('getConfiguration')->willReturn($config);

        $module = new TestableModule(
            $loris,
            'imaging_gateway',
            dirname(__DIR__),
        );
        $module->setLogger(new NullLogger());

        return $module;
    }
}
