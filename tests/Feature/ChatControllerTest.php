<?php

use App\Actions\Chat\AddEmployeeParticipant;
use App\Actions\Chat\CreateChatThread;
use App\Actions\Chat\StoreChatMessage;
use App\Models\ChatMessage;
use App\Models\ChatThread;
use App\Models\Citizen;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Mockery\MockInterface;

test('employees can create chats when a citizen identifier is provided', function () {
    $employee = new User([
        'id' => 10,
        'name' => 'Operatore',
        'email' => 'operatore@example.com',
        'password' => 'password',
    ]);
    $employee->id = 10;

    $thread = new ChatThread([
        'title' => 'Chat con Mario Rossi',
    ]);
    $thread->id = 55;

    $mock = Mockery::mock(CreateChatThread::class, function (MockInterface $mock) use ($employee, $thread): void {
        $mock->shouldReceive('handle')
            ->once()
            ->with($employee, Mockery::on(fn (array $payload) => $payload['citizen_identifier'] === 'RSSMRA80A01H501U'))
            ->andReturn($thread);
    });

    $this->app->instance(CreateChatThread::class, $mock);

    $this->actingAs($employee, 'employee')
        ->postJson(route('employee.chats.store'), [
            'citizen_identifier' => 'RSSMRA80A01H501U',
            'title' => 'Chat con Mario Rossi',
        ])
        ->assertCreated()
        ->assertJsonPath('message', 'Chat creata correttamente.')
        ->assertJsonPath('thread.title', 'Chat con Mario Rossi');
});

test('employee chat creation requires at least one citizen identifier', function () {
    $employee = new User([
        'id' => 10,
        'name' => 'Operatore',
        'email' => 'operatore@example.com',
        'password' => 'password',
    ]);
    $employee->id = 10;

    $this->actingAs($employee, 'employee')
        ->postJson(route('employee.chats.store'), [
            'title' => 'Chat senza cittadino',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['citizen_identifier']);
});

test('citizens cannot create chats from the employee endpoint', function () {
    $citizen = new Citizen([
        'name' => 'Mario Rossi',
        'email' => 'mario@example.com',
        'phone_number' => '+390916661111',
        'fiscal_code' => 'RSSMRA80A01H501U',
    ]);
    $citizen->id = 20;

    $this->actingAs($citizen, 'citizen')
        ->post(route('employee.chats.store'), [
            'citizen_identifier' => 'RSSMRA80A01H501U',
        ])
        ->assertRedirect(route('employee.login'));
});

test('employees can send chat messages with pdf or image attachments', function () {
    $employee = new User([
        'id' => 11,
        'name' => 'Operatore',
        'email' => 'operatore@example.com',
        'password' => 'password',
    ]);
    $employee->id = 11;

    $attachment = new MessageAttachment([
        'file_name' => 'allegato.pdf',
        'file_path' => 'chat-attachments/99/77/allegato.pdf',
    ]);
    $attachment->id = 501;

    $message = new ChatMessage([
        'content' => 'Buongiorno',
    ]);
    $message->id = 77;
    $message->setRelation('attachments', new Collection([$attachment]));

    $mock = Mockery::mock(StoreChatMessage::class, function (MockInterface $mock) use ($employee, $message): void {
        $mock->shouldReceive('handle')
            ->once()
            ->with(
                99,
                $employee,
                'Buongiorno',
                Mockery::on(fn (array $files) => count($files) === 2 && $files[0] instanceof UploadedFile && $files[1] instanceof UploadedFile)
            )
            ->andReturn($message);
    });

    $this->app->instance(StoreChatMessage::class, $mock);

    $this->actingAs($employee, 'employee')
        ->postJson(route('employee.chats.messages.store', ['chat' => 99]), [
            'content' => 'Buongiorno',
            'attachments' => [
                UploadedFile::fake()->create('allegato.pdf', 200, 'application/pdf'),
                UploadedFile::fake()->create('foto.jpg', 200, 'image/jpeg'),
            ],
        ])
        ->assertCreated()
        ->assertJsonPath('status', 'Messaggio inviato correttamente.')
        ->assertJsonPath('message.content', 'Buongiorno');
});

test('employees can add additional employee participants to a chat', function () {
    $employee = new User([
        'id' => 16,
        'name' => 'Operatore',
        'email' => 'operatore@example.com',
        'password' => 'password',
    ]);
    $employee->id = 16;

    $thread = new ChatThread([
        'title' => 'Chat con Mario Rossi',
    ]);
    $thread->id = 99;

    $mock = Mockery::mock(AddEmployeeParticipant::class, function (MockInterface $mock) use ($employee, $thread): void {
        $mock->shouldReceive('handle')
            ->once()
            ->with(99, $employee, 21)
            ->andReturn($thread);
    });

    $this->app->instance(AddEmployeeParticipant::class, $mock);

    $this->actingAs($employee, 'employee')
        ->postJson('/employee/chats/99/participants', [
            'employee_id' => 21,
        ])
        ->assertCreated()
        ->assertJsonPath('status', 'Partecipante aggiunto correttamente.')
        ->assertJsonPath('thread.title', 'Chat con Mario Rossi');
});

test('citizens can send chat messages with attachments', function () {
    $citizen = new Citizen([
        'name' => 'Mario Rossi',
        'email' => 'mario@example.com',
        'phone_number' => '+390916661111',
        'fiscal_code' => 'RSSMRA80A01H501U',
    ]);
    $citizen->id = 20;

    $message = new ChatMessage([
        'content' => 'Ho allegato il documento richiesto.',
    ]);
    $message->id = 78;
    $message->setRelation('attachments', new Collection());

    $mock = Mockery::mock(StoreChatMessage::class, function (MockInterface $mock) use ($citizen, $message): void {
        $mock->shouldReceive('handle')
            ->once()
            ->with(
                100,
                $citizen,
                'Ho allegato il documento richiesto.',
                Mockery::on(fn (array $files) => count($files) === 1 && $files[0] instanceof UploadedFile)
            )
            ->andReturn($message);
    });

    $this->app->instance(StoreChatMessage::class, $mock);

    $this->actingAs($citizen, 'citizen')
        ->postJson(route('citizen.chats.messages.store', ['chat' => 100]), [
            'content' => 'Ho allegato il documento richiesto.',
            'attachments' => [
                UploadedFile::fake()->create('documento.pdf', 512, 'application/pdf'),
            ],
        ])
        ->assertCreated()
        ->assertJsonPath('message.content', 'Ho allegato il documento richiesto.');
});

test('citizen chat submissions use the citizen guard when both sessions are active', function () {
    $employee = new User([
        'id' => 22,
        'name' => 'Operatore',
        'email' => 'operatore@example.com',
        'password' => 'password',
    ]);
    $employee->id = 22;

    $citizen = new Citizen([
        'name' => 'Mario Rossi',
        'email' => 'mario@example.com',
        'phone_number' => '+390916661111',
        'fiscal_code' => 'RSSMRA80A01H501U',
    ]);
    $citizen->id = 20;

    $message = new ChatMessage([
        'content' => 'Risposta dal cittadino.',
    ]);
    $message->id = 79;
    $message->setRelation('attachments', new Collection());

    $mock = Mockery::mock(StoreChatMessage::class, function (MockInterface $mock) use ($citizen, $message): void {
        $mock->shouldReceive('handle')
            ->once()
            ->with(100, $citizen, 'Risposta dal cittadino.', [])
            ->andReturn($message);
    });

    $this->app->instance(StoreChatMessage::class, $mock);

    $this->actingAs($employee, 'employee');
    $this->actingAs($citizen, 'citizen');

    $this->from(route('citizen.chats.index', ['chat' => 100]))
        ->post(route('citizen.chats.messages.store', ['chat' => 100]), [
            'content' => 'Risposta dal cittadino.',
        ])
        ->assertRedirect(route('citizen.chats.index', ['chat' => 100]))
        ->assertSessionHas('status', 'Messaggio inviato correttamente.');
});

test('chat messages cannot include more than five attachments', function () {
    $employee = new User([
        'id' => 12,
        'name' => 'Operatore',
        'email' => 'operatore@example.com',
        'password' => 'password',
    ]);
    $employee->id = 12;

    $this->actingAs($employee, 'employee')
        ->postJson(route('employee.chats.messages.store', ['chat' => 99]), [
            'attachments' => [
                UploadedFile::fake()->create('a.pdf', 10, 'application/pdf'),
                UploadedFile::fake()->create('b.pdf', 10, 'application/pdf'),
                UploadedFile::fake()->create('c.pdf', 10, 'application/pdf'),
                UploadedFile::fake()->create('d.pdf', 10, 'application/pdf'),
                UploadedFile::fake()->create('e.pdf', 10, 'application/pdf'),
                UploadedFile::fake()->create('f.pdf', 10, 'application/pdf'),
            ],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['attachments']);
});

test('chat messages only accept pdf files and images', function () {
    $employee = new User([
        'id' => 13,
        'name' => 'Operatore',
        'email' => 'operatore@example.com',
        'password' => 'password',
    ]);
    $employee->id = 13;

    $this->actingAs($employee, 'employee')
        ->postJson(route('employee.chats.messages.store', ['chat' => 99]), [
            'attachments' => [
                UploadedFile::fake()->create('file.docx', 10, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
            ],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['attachments.0']);
});

test('chat messages enforce a twenty megabyte file size limit', function () {
    $employee = new User([
        'id' => 14,
        'name' => 'Operatore',
        'email' => 'operatore@example.com',
        'password' => 'password',
    ]);
    $employee->id = 14;

    $this->actingAs($employee, 'employee')
        ->postJson(route('employee.chats.messages.store', ['chat' => 99]), [
            'attachments' => [
                UploadedFile::fake()->create('oversize.pdf', 20481, 'application/pdf'),
            ],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['attachments.0']);
});

test('chat messages require content or attachments', function () {
    $employee = new User([
        'id' => 15,
        'name' => 'Operatore',
        'email' => 'operatore@example.com',
        'password' => 'password',
    ]);
    $employee->id = 15;

    $this->actingAs($employee, 'employee')
        ->postJson(route('employee.chats.messages.store', ['chat' => 99]), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['content']);
});
