import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  EnrollmentResponse,
  CancellationResponse
} from '../../enrollment.models';

import { EnrollmentService } from '../../enrollment.service';

@Component({
  selector: 'app-my-enrollments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './my-enrollments.css',
  templateUrl: './my-enrollments.html',
})
export class MyEnrollments {

  private readonly enrollmentService = inject(EnrollmentService);

  enrollments = signal<EnrollmentResponse[]>([]);
  cancellationRequests = signal<CancellationResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  cancellationError = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  showCancellationForm = signal(false);
  selectedEnrollmentId = signal<number | null>(null);
  cancellationReason = signal('');
  isSubmitting = signal(false);

  ngOnInit(): void {
    this.loadEnrollments();
    this.loadCancellationRequests();
  }

  loadEnrollments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService
      .getMyEnrollments(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.enrollments.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            this.getErrorMessage(error, 'Unable to load your enrollments.')
          );
          this.isLoading.set(false);
        },
      });
  }

  loadCancellationRequests(): void {
    this.enrollmentService.getMyCancellationRequests(1, 100)
      .subscribe({
        next: (response) => {
          this.cancellationRequests.set(response.items);
        },
        error: (error) => {
          console.error('Unable to load cancellation requests', error);
        },
      });
  }

  statusLabel(status: number): string {
    return status === 0 ? 'Active' : 'Cancelled';
  }

  cancellationStatus(enrollmentId: number): string | null {
    const request = this.cancellationRequests().find(
      x => x.enrollmentId === enrollmentId
    );

    if (!request) return null;

    switch (request.status) {
      case 0: return 'Pending';
      case 1: return 'Approved';
      case 2: return 'Rejected';
      default: return 'Unknown';
    }
  }

  hasPendingRequest(enrollmentId: number): boolean {
    return this.cancellationRequests().some(
      x => x.enrollmentId === enrollmentId && x.status === 0
    );
  }

  openCancellationForm(enrollmentId: number): void {
    this.selectedEnrollmentId.set(enrollmentId);
    this.cancellationReason.set('');
    this.cancellationError.set('');
    this.showCancellationForm.set(true);
  }

  closeCancellationForm(): void {
    this.showCancellationForm.set(false);
    this.selectedEnrollmentId.set(null);
    this.cancellationReason.set('');
    this.cancellationError.set('');
  }

  submitCancellationRequest(): void {
    const enrollmentId = this.selectedEnrollmentId();
    const reason = this.cancellationReason().trim();

    if (!enrollmentId) return;

    if (!reason) {
      this.cancellationError.set('Please enter a reason for cancellation.');
      return;
    }

    if (reason.length > 1000) {
      this.cancellationError.set('Reason cannot exceed 1000 characters.');
      return;
    }

    this.isSubmitting.set(true);
    this.cancellationError.set('');

    this.enrollmentService
      .createCancellationRequest(enrollmentId, { reason })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set(
            'Cancellation request submitted successfully.'
          );
          this.closeCancellationForm();
          this.loadCancellationRequests();
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.cancellationError.set(
            this.getErrorMessage(
              error,
              'Unable to submit cancellation request.'
            )
          );
        },
      });
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update(page => page - 1);
      this.loadEnrollments();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update(page => page + 1);
      this.loadEnrollments();
    }
  }

  private getErrorMessage(
    error: HttpErrorResponse,
    fallback: string
  ): string {
    const body = error.error;

    if (typeof body === 'string' && body.trim()) return body;
    if (body?.detail) return body.detail;
    if (body?.message) return body.message;
    if (body?.title) return body.title;

    if (body?.errors) {
      const messages = Object.values(body.errors).flat();
      if (messages.length) {
        return messages.map(message => String(message)).join(' ');
      }
    }

    return fallback;
  }
}