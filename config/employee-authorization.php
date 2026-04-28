<?php

return [
    'permissions' => [
        [
            'key' => 'groups.create',
            'name' => 'Creare gruppi',
            'description' => 'Può creare gruppi e definirne nome e descrizione.',
        ],
        [
            'key' => 'groups.managers.assign',
            'name' => 'Assegnare group manager',
            'description' => 'Può assegnare e aggiornare i manager iniziali dei gruppi.',
        ],
        [
            'key' => 'groups.roles.manage',
            'name' => 'Gestire ruoli dei gruppi',
            'description' => 'Può creare, aggiornare ed eliminare i ruoli assegnabili nei gruppi.',
        ],
    ],
    'role_defaults' => [
        'admin' => [
            'groups.create',
            'groups.managers.assign',
            'groups.roles.manage',
        ],
    ],
];
