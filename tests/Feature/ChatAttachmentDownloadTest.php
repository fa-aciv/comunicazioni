<?php

use App\Http\Controllers\ChatAttachmentController;
use App\Models\Citizen;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

function mockAttachment(string $path, string $fileName, bool $isParticipant): MessageAttachment
{
    $chatRelation = \Mockery::mock(BelongsTo::class);
    $chatRelation->shouldReceive('whereHas')
        ->once()
        ->with('participants', \Mockery::type(Closure::class))
        ->andReturnSelf();
    $chatRelation->shouldReceive('exists')
        ->once()
        ->andReturn($isParticipant);

    $attachment = \Mockery::mock(MessageAttachment::class)->makePartial();
    $attachment->file_path = $path;
    $attachment->file_name = $fileName;
    $attachment->shouldReceive('chat')
        ->once()
        ->andReturn($chatRelation);

    return $attachment;
}

test('employee chat participants can download attachments', function () {
    Storage::fake('local');
    Storage::disk('local')->put('attachments/1/1/documento.pdf', 'contenuto');

    $employee = new User([
        'id' => 11,
        'name' => 'Operatore',
        'email' => 'operatore@example.com',
        'password' => 'password',
    ]);
    $employee->id = 11;

    $attachment = mockAttachment('attachments/1/1/documento.pdf', 'documento.pdf', true);

    $response = $this->actingAs($employee, 'employee')
        ->app
        ->make(ChatAttachmentController::class)
        ->show($attachment);

    TestResponse::fromBaseResponse($response)
        ->assertOk()
        ->assertDownload('documento.pdf');
});

test('citizen chat participants can download attachments', function () {
    Storage::fake('local');
    Storage::disk('local')->put('attachments/1/1/documento.pdf', 'contenuto');

    $citizen = new Citizen([
        'name' => 'Mario Rossi',
        'email' => 'mario@example.com',
        'phone_number' => '+390916661111',
        'fiscal_code' => 'RSSMRA80A01H501U',
    ]);
    $citizen->id = 20;

    $attachment = mockAttachment('attachments/1/1/documento.pdf', 'documento.pdf', true);

    $response = $this->actingAs($citizen, 'citizen')
        ->app
        ->make(ChatAttachmentController::class)
        ->show($attachment);

    TestResponse::fromBaseResponse($response)
        ->assertOk()
        ->assertDownload('documento.pdf');
});

test('non participants cannot download chat attachments', function () {
    $employee = new User([
        'id' => 99,
        'name' => 'Estraneo',
        'email' => 'estraneo@example.com',
        'password' => 'password',
    ]);
    $employee->id = 99;

    $attachment = mockAttachment('attachments/1/1/documento.pdf', 'documento.pdf', false);

    try {
        $this->actingAs($employee, 'employee')
            ->app
            ->make(ChatAttachmentController::class)
            ->show($attachment);

        $this->fail('Expected a 403 response for non participants.');
    } catch (HttpException $exception) {
        expect($exception->getStatusCode())->toBe(403);
    }
});
