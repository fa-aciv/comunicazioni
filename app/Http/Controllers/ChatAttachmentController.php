<?php

namespace App\Http\Controllers;

use App\Models\Citizen;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatAttachmentController extends Controller
{
    public function show(Request $request, MessageAttachment $attachment): StreamedResponse
    {
        $this->authorizeAttachment($attachment);

        $disk = $this->resolveDisk($attachment);

        return Storage::disk($disk)->response($attachment->file_path, $attachment->file_name);
    }

    public function download(Request $request, MessageAttachment $attachment): StreamedResponse
    {
        $this->authorizeAttachment($attachment);

        $disk = $this->resolveDisk($attachment);

        return Storage::disk($disk)->download($attachment->file_path, $attachment->file_name);
    }

    private function authorizeAttachment(MessageAttachment $attachment): void
    {
        $actor = $this->resolveActor();

        $isParticipant = $attachment->chat()
            ->whereHas('participants', function ($query) use ($actor): void {
                $query
                    ->where('participant_type', $actor::class)
                    ->where('participant_id', $actor->getKey());
            })
            ->exists();

        abort_unless($isParticipant, 403);
    }

    private function resolveDisk(MessageAttachment $attachment): string
    {
        $disk = config('filesystems.default', 'local');

        abort_unless(Storage::disk($disk)->exists($attachment->file_path), 404);

        return $disk;
    }

    private function resolveActor(): Model
    {
        $employee = Auth::guard('employee')->user();

        if ($employee instanceof User) {
            return $employee;
        }

        $citizen = Auth::guard('citizen')->user();

        if ($citizen instanceof Citizen) {
            return $citizen;
        }

        abort(403);
    }
}
