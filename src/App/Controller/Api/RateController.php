<?php

namespace App\Controller\Api;

use App\Service\ExchangeRateService;
use App\Service\NBPClient;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use DateTimeImmutable;

class RateController extends AbstractController
{
    public function __construct(
        private ExchangeRateService $rateService,
        private NBPClient $nbpClient
    ) {}

    /**
     * Obsługuje trasę: GET /api/rates
     * Definicja trasy jest w: config/routes/api_routes.yaml
     */
    public function getRates(Request $request): JsonResponse
    {
        $date = $request->query->get('date', 'today');

        if ($date !== 'today' && !DateTimeImmutable::createFromFormat('Y-m-d', $date)) {
            return $this->json(['error' => 'Invalid date format. Use YYYY-MM-DD or "today".'], 400);
        }

        $calculatedRates = $this->rateService->getCalculatedRates($date);

        if (empty($calculatedRates)) {
            return $this->json([]);
        }

        return $this->json($calculatedRates);
    }

    /**
     * Obsługuje trasę: GET /api/rates/{code}/history
     * Definicja trasy jest w: config/routes/api_routes.yaml
     */
    public function getHistoricalRates(string $code, Request $request): JsonResponse
    {
        // 1. Pobieramy parametry z query stringa
        $endDate = $request->query->get('endDate', 'today');
        $days = $request->query->getInt('days', 14);

        // 2. Walidacja daty
        $realEndDate = $endDate === 'today' ? date('Y-m-d') : $endDate;
        if (!DateTimeImmutable::createFromFormat('Y-m-d', $realEndDate)) {
            return $this->json(['error' => 'Invalid endDate format. Use YYYY-MM-DD or "today".'], 400);
        }

        // 3. Przekazujemy {code} i $realEndDate do serwisu
        $history = $this->rateService->getHistoricalRates($code, $realEndDate, $days);

        // 4. Obsługa braku danych
        if (empty($history)) {
            return $this->json([]);
        }
        
        // 5. Zwracamy historię
        return $this->json($history);
    }
}