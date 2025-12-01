namespace Savi.SharedKernel.Common;

/// <summary>
/// Represents a paginated result set for list endpoints.
/// All list endpoints MUST use this for consistent pagination.
/// </summary>
/// <typeparam name="T">The type of items in the result set.</typeparam>
/// <param name="Items">The items in the current page.</param>
/// <param name="Page">The current page number (1-based).</param>
/// <param name="PageSize">The number of items per page.</param>
/// <param name="TotalCount">The total number of items across all pages.</param>
public sealed record PagedResult<T>(
    IReadOnlyCollection<T> Items,
    int Page,
    int PageSize,
    int TotalCount)
{
    /// <summary>
    /// The total number of pages based on TotalCount and PageSize.
    /// </summary>
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling(TotalCount / (double)PageSize) : 0;

    /// <summary>
    /// Indicates whether there is a next page available.
    /// </summary>
    public bool HasNextPage => Page < TotalPages;

    /// <summary>
    /// Indicates whether there is a previous page available.
    /// </summary>
    public bool HasPreviousPage => Page > 1;

    /// <summary>
    /// Creates an empty paged result.
    /// </summary>
    public static PagedResult<T> Empty(int page = 1, int pageSize = 10)
        => new(Array.Empty<T>(), page, pageSize, 0);

    /// <summary>
    /// Creates a paged result from a collection.
    /// </summary>
    /// <param name="items">The items for the current page.</param>
    /// <param name="page">Current page number (1-based).</param>
    /// <param name="pageSize">Items per page.</param>
    /// <param name="totalCount">Total items across all pages.</param>
    public static PagedResult<T> Create(
        IReadOnlyCollection<T> items,
        int page,
        int pageSize,
        int totalCount)
        => new(items, page, pageSize, totalCount);
}

