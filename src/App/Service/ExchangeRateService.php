<?php

namespace App\Service;

use App\Service\NBPClient;
use DateTimeImmutable;
use DateInterval;

class ExchangeRateService
{
    private const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'CZK', 'IDR', 'BRL'];

    private const MARGINS = [
        'EUR' => ['buy' => 0.15, 'sell' => 0.11, 'is_buying' => true],
        'USD' => ['buy' => 0.15, 'sell' => 0.11, 'is_buying' => true],
        'CZK' => ['buy' => null, 'sell' => 0.20, 'is_buying' => false],
        'IDR' => ['buy' => null, 'sell' => 0.20, 'is_buying' => false],
        'BRL' => ['buy' => null, 'sell' => 0.20, 'is_buying' => false],
    ];

    public function __construct(private NBPClient $nbpClient) {}

    private function calculateMargins(array $nbpRates): array
    {
        $kantorRates = [];

        foreach ($nbpRates as $rate) {
            $code = $rate['code'];
            
            if (!in_array($code, self::SUPPORTED_CURRENCIES)) {
                continue;
            }

            $mid = $rate['mid'];
            $margins = self::MARGINS[$code];
            
            $buyRate = null;
            $sellRate = round($mid + $margins['sell'], 4);

            // Reguła kupna (tylko dla EUR i USD)
            if ($margins['is_buying']) {
                $buyRate = round($mid - $margins['buy'], 4);
            }

            $kantorRates[] = [
                'code' => $code,
                'currency' => $rate['currency'],
                'mid_rate_nbp' => $mid,
                'buy_rate' => $buyRate,
                'sell_rate' => $sellRate,
                'is_buying' => $margins['is_buying'],
            ];
        }

        return $kantorRates;
    }

    public function getCalculatedRates(string $date = 'today'): array
    {
        $nbpRates = $this->nbpClient->getSingleRateForDate($date);

        if (empty($nbpRates)) {
            return [];
        }

        return $this->calculateMargins($nbpRates);
    }

    public function getHistoricalRates(string $code, string $endDate, int $days = 14): array
    {
        $history = [];
        $currencyCode = strtoupper($code);

        if (!in_array($currencyCode, self::SUPPORTED_CURRENCIES)) {
            return [];
        }

        try {
            $currentDate = new DateTimeImmutable($endDate);
        } catch (\Exception $e) {
            return [];
        }

        $foundDays = 0;
        for ($i = 0; $foundDays < $days && $i < ($days * 3); $i++) {
            $date = $currentDate->sub(new DateInterval("P{$i}D"))->format('Y-m-d');
            
            $nbpRates = $this->nbpClient->getSingleRateForDate($date);
            
            if (empty($nbpRates)) {
                continue;
            }

            $dailyRates = $this->calculateMargins($nbpRates);
            
            $filteredRate = null;
            foreach ($dailyRates as $rate) {
                if ($rate['code'] === $currencyCode) {
                    $filteredRate = [
                        'date' => $date,
                        'buyRate' => $rate['buy_rate'],
                        'sellRate' => $rate['sell_rate'],
                    ];
                    break;
                }
            }

            if ($filteredRate) {
                $history[] = $filteredRate;
                $foundDays++;
            }
        }

        return array_reverse($history);
    }
}