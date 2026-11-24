import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EnrollmentService } from '../../enrollments/enrollment.service';

import {
  CancellationResponse
} from '../../enrollments/enrollment.models';

@Component({
  selector: 'app-cancellation-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cancellation-requests.html',
  styleUrl: './cancellation-requests.css'
})
export class CancellationRequests implements OnInit {

  private readonly enrollmentService = inject(EnrollmentService);

  requests = signal<CancellationResponse[]>([]);

  isLoading = signal(false);
  isProcessing = signal(false);

  errorMessage = signal('');
  successMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);

  totalRecords = signal(0);
  totalPages = signal(0);

  selectedRequest = signal<CancellationResponse | null>(null);

  selectedAction = signal<'approve' | 'reject' | null>(null);

  adminRemarks = signal('');

  ngOnInit(): void {
    this.loadRequests();
  }

  // Load cancellation requests
  loadRequests(): void {

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService
      .getCancellationRequests(this.pageNumber(), this.pageSize())
      .subscribe({

        next: (response) => {

          this.requests.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);

          this.isLoading.set(false);
        },

        error: (error: HttpErrorResponse) => {

          this.errorMessage.set(
            this.getErrorMessage(
              error,
              'Unable to load cancellation requests.'
            )
          );

          this.isLoading.set(false);
        }
      });
  }

  // Display cancellation status
  statusLabel(status: number): string {

    switch (status) {

      case 0:
        return 'Pending';

      case 1:
        return 'Approved';

      case 2:
        return 'Rejected';

      default:
        return 'Unknown';
    }
  }

  // Open review popup
  openReview(
    request: CancellationResponse,
    action: 'approve' | 'reject'
  ): void {

    this.selectedRequest.set(request);
    this.selectedAction.set(action);
    this.adminRemarks.set('');
    this.errorMessage.set('');
  }

  // Close review popup
  closeReview(): void {

    this.selectedRequest.set(null);
    this.selectedAction.set(null);
    this.adminRemarks.set('');
  }

  // Approve or reject request
  submitReview(): void {

    const request = this.selectedRequest();
    const action = this.selectedAction();

    if (!request || !action) {
      return;
    }

    const reviewData = {
      adminRemarks: this.adminRemarks().trim()
    };

    this.isProcessing.set(true);
    this.errorMessage.set('');

    const apiCall =
      action === 'approve'
        ? this.enrollmentService.approveCancellationRequest(
            request.cancellationRequestId,
            reviewData
          )
        : this.enrollmentService.rejectCancellationRequest(
            request.cancellationRequestId,
            reviewData
          );

    apiCall.subscribe({

      next: () => {

        this.isProcessing.set(false);

        this.successMessage.set(
          action === 'approve'
            ? 'Cancellation request approved successfully.'
            : 'Cancellation request rejected successfully.'
        );

        this.closeReview();
        this.loadRequests();
      },

      error: (error: HttpErrorResponse) => {

        this.isProcessing.set(false);

        this.errorMessage.set(
          this.getErrorMessage(
            error,
            'Unable to process cancellation request.'
          )
        );
      }
    });
  }

  // Previous page
  previousPage(): void {

    if (this.pageNumber() > 1) {

      this.pageNumber.update(page => page - 1);
      this.loadRequests();
    }
  }

  // Next page
  nextPage(): void {

    if (this.pageNumber() < this.totalPages()) {

      this.pageNumber.update(page => page + 1);
      this.loadRequests();
    }
  }

  // Error handler
  private getErrorMessage(
    error: HttpErrorResponse,
    fallback: string
  ): string {

    const body = error.error;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    if (body?.detail) {
      return body.detail;
    }

    if (body?.message) {
      return body.message;
    }

    if (body?.title) {
      return body.title;
    }

    if (body?.errors) {
      const messages = Object.values(body.errors).flat();

      if (messages.length) {
        return messages.map(message => String(message)).join(' ');
      }
    }

    return fallback;
  }
}