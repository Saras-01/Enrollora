import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PagedResult } from '../../shared/models/paged-result.model';

import {
  CreateEnrollmentRequest,
  EnrollmentFilter,
  EnrollmentResponse,
  CreateCancellationRequest,
  CancellationResponse,
  CancellationFilter,
  ReviewCancellationRequest
} from './enrollment.models';

@Injectable({
  providedIn: 'root',
})
export class EnrollmentService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/enrollments`;

  private readonly cancellationUrl =
    `${environment.apiUrl}/cancellation-requests`;

  // Get all enrollments - Admin
  getEnrollments(
    pageNumber = 1,
    pageSize = 10,
    filters?: EnrollmentFilter,
  ): Observable<PagedResult<EnrollmentResponse>> {

    return this.http.get<PagedResult<EnrollmentResponse>>(
      this.apiUrl,
      {
        params: this.buildParams(pageNumber, pageSize, filters),
      }
    );
  }

  // Get logged-in student's enrollments
  getMyEnrollments(
    pageNumber = 1,
    pageSize = 10,
    filters?: EnrollmentFilter,
  ): Observable<PagedResult<EnrollmentResponse>> {

    return this.http.get<PagedResult<EnrollmentResponse>>(
      `${this.apiUrl}/my`,
      {
        params: this.buildParams(pageNumber, pageSize, filters),
      }
    );
  }

  // Get enrollments by student
  getEnrollmentsByStudent(
    studentId: number,
    pageNumber = 1,
    pageSize = 10,
  ): Observable<PagedResult<EnrollmentResponse>> {

    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<PagedResult<EnrollmentResponse>>(
      `${this.apiUrl}/student/${studentId}`,
      { params }
    );
  }

  // Get enrollments by course
  getEnrollmentsByCourse(
    courseId: number,
    pageNumber = 1,
    pageSize = 10,
  ): Observable<PagedResult<EnrollmentResponse>> {

    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<PagedResult<EnrollmentResponse>>(
      `${this.apiUrl}/course/${courseId}`,
      { params }
    );
  }

  // Create enrollment
  createEnrollment(
    request: CreateEnrollmentRequest
  ): Observable<EnrollmentResponse> {

    return this.http.post<EnrollmentResponse>(
      this.apiUrl,
      request
    );
  }

  // Student: Submit cancellation request
  createCancellationRequest(
    enrollmentId: number,
    request: CreateCancellationRequest
  ): Observable<CancellationResponse> {

    return this.http.post<CancellationResponse>(
      `${this.apiUrl}/${enrollmentId}/cancellation-request`,
      request
    );
  }

  // Student: Get own cancellation requests
  getMyCancellationRequests(
    pageNumber = 1,
    pageSize = 10,
    filters?: CancellationFilter
  ): Observable<PagedResult<CancellationResponse>> {

    return this.http.get<PagedResult<CancellationResponse>>(
      `${this.cancellationUrl}/my`,
      {
        params: this.buildParams(pageNumber, pageSize, filters)
      }
    );
  }

  // Admin: Get all cancellation requests
  getCancellationRequests(
    pageNumber = 1,
    pageSize = 10,
    filters?: CancellationFilter
  ): Observable<PagedResult<CancellationResponse>> {

    return this.http.get<PagedResult<CancellationResponse>>(
      this.cancellationUrl,
      {
        params: this.buildParams(pageNumber, pageSize, filters)
      }
    );
  }

  // Admin: Approve cancellation request
  approveCancellationRequest(
    requestId: number,
    request: ReviewCancellationRequest
  ): Observable<CancellationResponse> {

    return this.http.put<CancellationResponse>(
      `${this.cancellationUrl}/${requestId}/approve`,
      request
    );
  }

  // Admin: Reject cancellation request
  rejectCancellationRequest(
    requestId: number,
    request: ReviewCancellationRequest
  ): Observable<CancellationResponse> {

    return this.http.put<CancellationResponse>(
      `${this.cancellationUrl}/${requestId}/reject`,
      request
    );
  }

  // Build query parameters
  private buildParams(
    pageNumber: number,
    pageSize: number,
    filters?: EnrollmentFilter | CancellationFilter,
  ): HttpParams {

    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    if (filters?.courseId != null) {
      params = params.set('courseId', filters.courseId);
    }

    if (filters?.status != null) {
      params = params.set('status', filters.status);
    }

    if (filters?.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }

    if (filters?.toDate) {
      params = params.set('toDate', filters.toDate);
    }

    return params;
  }
}