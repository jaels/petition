
DROP TABLE IF EXISTS signatures;
CREATE TABLE signatures (
    id SERIAL primary key,
    firstname VARCHAR(255) not null,
    lastname VARCHAR(255) not null,
    signature TEXT,
    user_id INTEGER,
    created_at TIMESTAMP default CURRENT_TIMESTAMP

);

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id SERIAL primary key,
    firstname VARCHAR(255) not null,
    lastname VARCHAR(255) not null,
    email VARCHAR(255) not null,
    password VARCHAR(255) not null,
    created_at TIMESTAMP default CURRENT_TIMESTAMP

);
