<?php

declare(strict_types=1);

namespace App\Models;

use DateTimeImmutable;
use PDO;
use RuntimeException;

class Calculo
{
    public function create(array $data): int
    {
        $sql = <<<SQL
            INSERT INTO calculos (
                user_id,
                titulo,
                valor_base,
                data_inicio,
                data_citacao,
                data_final,
                tipo_calculo,
                resultado,
                arquivo_pdf
            ) VALUES (
                :user_id,
                :titulo,
                :valor_base,
                :data_inicio,
                :data_citacao,
                :data_final,
                :tipo_calculo,
                :resultado,
                :arquivo_pdf
            )
        SQL;

        $statement = \Database::connection()->prepare($sql);
        $statement->bindValue(':user_id', $data['user_id'], PDO::PARAM_INT);
        $statement->bindValue(':titulo', $data['titulo']);
        $statement->bindValue(':valor_base', $data['valor_base']);
        $statement->bindValue(':data_inicio', $data['data_inicio']);
        $statement->bindValue(':data_citacao', $data['data_citacao']);
        $statement->bindValue(':data_final', $data['data_final']);
        $statement->bindValue(':tipo_calculo', $data['tipo_calculo']);
        $statement->bindValue(':resultado', $data['resultado']);
        $statement->bindValue(':arquivo_pdf', $data['arquivo_pdf']);

        if (!$statement->execute()) {
            throw new RuntimeException('Não foi possível salvar o cálculo.');
        }

        return (int) \Database::connection()->lastInsertId();
    }

    public function listByUser(int $userId): array
    {
        $sql = 'SELECT * FROM calculos WHERE user_id = :user_id ORDER BY created_at DESC';
        $statement = \Database::connection()->prepare($sql);
        $statement->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $statement->execute();

        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }

    public function countForMonth(int $userId, DateTimeImmutable $month): int
    {
        $start = $month->format('Y-m-01');
        $end = $month->format('Y-m-t');

        $sql = <<<SQL
            SELECT COUNT(*) as total
            FROM calculos
            WHERE user_id = :user_id
              AND DATE(created_at) BETWEEN :start AND :end
        SQL;

        $statement = \Database::connection()->prepare($sql);
        $statement->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $statement->bindValue(':start', $start);
        $statement->bindValue(':end', $end);
        $statement->execute();

        $row = $statement->fetch(PDO::FETCH_ASSOC);

        return (int) ($row['total'] ?? 0);
    }

    public function findByIdForUser(int $calculoId, int $userId): ?array
    {
        $sql = 'SELECT * FROM calculos WHERE id = :id AND user_id = :user_id LIMIT 1';
        $statement = \Database::connection()->prepare($sql);
        $statement->bindValue(':id', $calculoId, PDO::PARAM_INT);
        $statement->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $statement->execute();

        $result = $statement->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }
}

