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
            'name' => 'Gestire permessi membri',
            'description' => 'Può modificare ruolo e permessi specifici dei membri del gruppo.',
        ],
    ],
    'role_defaults' => [
        'manager' => [
            'group.members.add',
            'group.members.remove',
            'group.members.permissions.manage',
        ],
        'user' => [
            'group.contact_requests.accept',
        ],
    ],
];
