<?php

namespace App\Service;

use GuzzleHttp\Client;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Component\HttpFoundation\Response;
use GuzzleHttp\Exception\ClientException;

class NBPClient
{
    private const NBP_API_URL = 'https://api.nbp.pl/api/exchangerates/tables/A/';
    private const NBP_TTL = 43200; // 12 godzin

    public function __construct(
        private Client $httpClient,
        private CacheInterface $cache
    ) {}

    public function getSingleRateForDate(string $date = 'today'): array
    {
        $realDate = $date === 'today' ? date('Y-m-d') : $date;
        $cacheKey = 'nbp_table_a_' . $realDate;

        return $this->cache->get($cacheKey, function () use ($realDate, $date) {
        $endpoint = $date === 'today' ? '?format=json' : $realDate . '/?format=json';
        $url = self::NBP_API_URL . $endpoint;

            try {
                $response = $this->httpClient->request('GET', $url);

                $content = $response->getBody()->getContents();
                $data = json_decode($content, true);
                
                return $data[0]['rates'] ?? [];

            } catch (ClientException $e) {
                if ($e->getResponse() && $e->getResponse()->getStatusCode() === Response::HTTP_NOT_FOUND) {
                    return [];
                }
                return [];
            }
            catch (\Exception $e) {
                return [];
            }
        }, self::NBP_TTL);
    }
}