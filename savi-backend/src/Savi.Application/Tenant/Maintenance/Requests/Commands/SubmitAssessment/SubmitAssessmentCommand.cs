using MediatR;
using Savi.SharedKernel.Common;

namespace Savi.Application.Tenant.Maintenance.Requests.Commands.SubmitAssessment;

/// <summary>
/// Command to submit a site visit assessment for a maintenance request.
/// </summary>
public record SubmitAssessmentCommand(
    Guid RequestId,
    string AssessmentSummary
) : IRequest<Result>;
