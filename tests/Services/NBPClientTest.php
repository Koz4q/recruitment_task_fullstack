<?php

namespace App\Tests\Service;

use App\Service\NBPClient;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class NBPClientIntegrationTest extends KernelTestCase
{
    private $nbpClient;

    protected function setUp(): void
    {
        // 1. Uruchom jądro Symfony (w trybie testowym)
        self::bootKernel();

        // 2. Pobierz kontener serwisów
        $container = self::$container;

        // 3. Pobierz serwis NBPClient z kontenera
        $this->nbpClient = $container->get(NBPClient::class);
    }

    // Test 1: Sprawdza, czy serwis został poprawnie wczytany
    public function testServiceIsWiredCorrectly()
    {
        $this->assertInstanceOf(NBPClient::class, $this->nbpClient);
    }

    // Test 2: Wykonuje PRAWDZIWE zapytanie do API NBP
    public function testFetchesRealDataFromNbp()
    {
        $rates = $this->nbpClient->getSingleRateForDate('2025-11-13');

        // Sprawdzamy, czy API cokolwiek zwróciło
        $this->assertIsArray($rates);
        $this->assertNotEmpty($rates);
        
        // Sprawdzamy, czy struktura danych jest poprawna
        $this->assertArrayHasKey('code', $rates[0]);
        $this->assertArrayHasKey('mid', $rates[0]);
    }

    // Test 3: Sprawdza, czy API poprawnie obsługuje weekend
    public function testHandlesWeekendsCorrectly()
    {
        $rates = $this->nbpClient->getSingleRateForDate('2025-11-15');

        // Serwis powinien złapać błąd 404 i zwrócić pustą tablicę
        $this->assertIsArray($rates);
        $this->assertEmpty($rates);
    }
}