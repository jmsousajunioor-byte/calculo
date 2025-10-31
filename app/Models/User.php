<?php

declare(strict_types=1);

namespace App\Models;

use PDO;
use RuntimeException;

class User
{
    public function create(string $name, string $email, string $password): int
    {
        $sql = 'INSERT INTO users (name, email, password) VALUES (:name, :email, :password)';

        $statement = \Database::connection()->prepare($sql);
        $statement->bindValue(':name', $name);
        $statement->bindValue(':email', $email);
        $statement->bindValue(':password', $password);

        if (!$statement->execute()) {
            throw new RuntimeException('Falha ao cadastrar usuário.');
        }

        return (int) \Database::connection()->lastInsertId();
    }

    public function findByEmail(string $email): ?array
    {
        $sql = 'SELECT * FROM users WHERE email = :email LIMIT 1';
        $statement = \Database::connection()->prepare($sql);
        $statement->bindValue(':email', $email);
        $statement->execute();

        $result = $statement->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    public function findById(int $id): ?array
    {
        $sql = 'SELECT * FROM users WHERE id = :id LIMIT 1';
        $statement = \Database::connection()->prepare($sql);
        $statement->bindValue(':id', $id, PDO::PARAM_INT);
        $statement->execute();

        $result = $statement->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }
}

