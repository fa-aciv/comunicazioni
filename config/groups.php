<?php

return [
    'permissions' => [
        [
            'key' => 'group.contact_requests.accept',
            'name' => 'Accettare richieste di contatto',
            'description' => 'Può accettare le richieste di contatto dei cittadini indirizzate al gruppo.',
        ],
        [
            'key' => 'group.members.add',
            'name' => 'Aggiungere membri',
            'description' => 'Può aggiungere dipendenti al gruppo.',
        ],
        [
            'key' => 'group.members.remove',
            'name' => 'Rimuovere membri',
            'description' => 'Può rimuovere dipendenti già assegnati al gruppo.',
        ],
        [
            'key' => 'group.members.permissions.manage',
            'name' => 'Gestire ruoli membri',
            'description' => 'Può modificare il ruolo assegnato ai membri del gruppo.',
        ],
    ],
    'manager_permission_keys' => [
        'group.members.add',
        'group.members.remove',
        'group.members.permissions.manage',
    ],
    'seed_roles' => [
        [
            'key' => 'manager',
            'name' => 'Manager',
            'description' => 'Può gestire i membri del gruppo e le loro assegnazioni di ruolo.',
            'permission_keys' => [
                'group.members.add',
                'group.members.remove',
                'group.members.permissions.manage',
            ],
        ],
        [
            'key' => 'user',
            'name' => 'User',
            'description' => 'Può accettare le richieste di contatto indirizzate al gruppo.',
            'permission_keys' => [
                'group.contact_requests.accept',
            ],
        ],
    ],
];
