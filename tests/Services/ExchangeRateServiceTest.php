<?php

namespace App\Tests\Service;

use App\Service\ExchangeRateService;
use App\Service\NBPClient;
use PHPUnit\Framework\TestCase;

class ExchangeRateServiceTest extends TestCase
{
    private $nbpClientMock;
    private $exchangeRateService;

    protected function setUp(): void
    {
        // Tworzymy "atrapę" (mock) NBPClienta,
        // ponieważ nie chcemy testować tutaj samego NBPClienta.
        $this->nbpClientMock = $this->createMock(NBPClient::class);
        
        // Tworzymy instancję serwisu, który będziemy testować
        $this->exchangeRateService = new ExchangeRateService($this->nbpClientMock);
    }

    public function testCalculateMarginsCorrectly()
    {
        // 1. ARRANGE (Przygotowanie)
        // Dane wejściowe symulujące odpowiedź z NBP
        $nbpRates = [
            [
                'code' => 'USD',
                'currency' => 'dolar amerykański',
                'mid' => 4.0000,
            ],
            [
                'code' => 'EUR',
                'currency' => 'euro',
                'mid' => 4.3000,
            ],
            [
                'code' => 'CZK',
                'currency' => 'korona czeska',
                'mid' => 0.2000,
            ],
            [
                'code' => 'THB', // Waluta nieobsługiwana
                'currency' => 'bat (Tajlandia)',
                'mid' => 0.1000,
            ],
        ];

        // 2. ACT
        $result = $this->exchangeRateService->getCalculatedRates('today');
        
        // (Mockujemy NBPClient, aby zwrócił nasze dane testowe)
        $this->nbpClientMock->method('getSingleRateForDate')
             ->willReturn($nbpRates);

        $result = $this->exchangeRateService->getCalculatedRates('today');

        // 3. ASSERT (Sprawdzenie)
        
        // Oczekujemy 3 walut (USD, EUR, CZK), THB powinno być odfiltrowane
        $this->assertCount(3, $result);

        // --- Sprawdzenie USD (kupowalna) ---
        $usdRate = $result[0];
        $this->assertEquals('USD', $usdRate['code']);
        $this->assertEquals(true, $usdRate['is_buying']);
        $this->assertEquals(3.8500, $usdRate['buy_rate']); // 4.0000 - 0.15
        $this->assertEquals(4.1100, $usdRate['sell_rate']); // 4.0000 + 0.11

        // --- Sprawdzenie EUR (kupowalna) ---
        $eurRate = $result[1];
        $this->assertEquals('EUR', $eurRate['code']);
        $this->assertEquals(true, $eurRate['is_buying']);
        $this->assertEquals(4.1500, $eurRate['buy_rate']); // 4.3000 - 0.15
        $this->assertEquals(4.4100, $eurRate['sell_rate']); // 4.3000 + 0.11

        // --- Sprawdzenie CZK (niekupowalna) ---
        $czkRate = $result[2];
        $this->assertEquals('CZK', $czkRate['code']);
        $this->assertEquals(false, $czkRate['is_buying']);
        $this->assertNull($czkRate['buy_rate']); // Nie kupujemy
        $this->assertEquals(0.4000, $czkRate['sell_rate']); // 0.2000 + 0.20
    }

    public function testGetHistoricalRatesFiltersByCode()
    {
        // 1. ARRANGE
        $date = '2025-11-13';
        $code = 'USD';

        // Dane z NBP dla jednego dnia
        $nbpRates = [
            ['code' => 'USD', 'currency' => 'dolar', 'mid' => 4.0000],
            ['code' => 'EUR', 'currency' => 'euro', 'mid' => 4.3000],
        ];

        // Oczekiwany wynik (tylko USD, przeliczone)
        $expectedHistory = [
            [
                'date' => $date,
                'buyRate' => 3.8500,
                'sellRate' => 4.1100,
            ]
        ];

        // Ustawiamy mocka NBPClient, aby zwrócił nasze dane dla tej daty
        $this->nbpClientMock->expects($this->once()) // Oczekujemy wywołania tylko raz
             ->method('getSingleRateForDate')
             ->with($date) // Sprawdzamy, czy wywołano z poprawną datą
             ->willReturn($nbpRates);
        
        // 2. ACT
        $result = $this->exchangeRateService->getHistoricalRates($code, $date, 1);

        // 3. ASSERT
        $this->assertEquals($expectedHistory, $result);
    }
}