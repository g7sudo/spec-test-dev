namespace Savi.SharedKernel.Common;

/// <summary>
/// Represents the outcome of an operation that may succeed or fail.
/// Use this for operations that don't return a value on success.
/// </summary>
public class Result
{
    /// <summary>
    /// Indicates whether the operation succeeded.
    /// </summary>
    public bool IsSuccess { get; }

    /// <summary>
    /// Indicates whether the operation failed.
    /// </summary>
    public bool IsFailure => !IsSuccess;

    /// <summary>
    /// Collection of error messages if the operation failed.
    /// </summary>
    public IReadOnlyList<string> Errors { get; }

    /// <summary>
    /// Single error message (first error if multiple exist).
    /// </summary>
    public string? Error => Errors.FirstOrDefault();

    // Protected constructor - use static factory methods
    protected Result(bool isSuccess, IReadOnlyList<string> errors)
    {
        // Invariant: Success cannot have errors, Failure must have errors
        if (isSuccess && errors.Count > 0)
        {
            throw new InvalidOperationException("A successful result cannot have errors.");
        }

        if (!isSuccess && errors.Count == 0)
        {
            throw new InvalidOperationException("A failed result must have at least one error.");
        }

        IsSuccess = isSuccess;
        Errors = errors;
    }

    /// <summary>
    /// Creates a successful result.
    /// </summary>
    public static Result Success() => new(true, Array.Empty<string>());

    /// <summary>
    /// Creates a failed result with a single error message.
    /// </summary>
    public static Result Failure(string error) => new(false, new[] { error });

    /// <summary>
    /// Creates a failed result with multiple error messages.
    /// </summary>
    public static Result Failure(IEnumerable<string> errors) => new(false, errors.ToList());

    /// <summary>
    /// Creates a successful result with a value.
    /// </summary>
    public static Result<T> Success<T>(T value) => Result<T>.Success(value);

    /// <summary>
    /// Creates a failed result with a single error message (typed).
    /// </summary>
    public static Result<T> Failure<T>(string error) => Result<T>.Failure(error);

    /// <summary>
    /// Creates a failed result with multiple error messages (typed).
    /// </summary>
    public static Result<T> Failure<T>(IEnumerable<string> errors) => Result<T>.Failure(errors);
}

/// <summary>
/// Represents the outcome of an operation that returns a value on success.
/// </summary>
/// <typeparam name="T">The type of the value returned on success.</typeparam>
public class Result<T> : Result
{
    private readonly T? _value;

    /// <summary>
    /// The value returned by a successful operation.
    /// Throws if the result is a failure.
    /// </summary>
    public T Value
    {
        get
        {
            if (IsFailure)
            {
                throw new InvalidOperationException(
                    $"Cannot access Value on a failed result. Errors: {string.Join(", ", Errors)}");
            }

            return _value!;
        }
    }

    // Private constructor - use static factory methods
    private Result(T? value, bool isSuccess, IReadOnlyList<string> errors)
        : base(isSuccess, errors)
    {
        _value = value;
    }

    /// <summary>
    /// Creates a successful result with a value.
    /// </summary>
    public static Result<T> Success(T value) => new(value, true, Array.Empty<string>());

    /// <summary>
    /// Creates a failed result with a single error message.
    /// </summary>
    public new static Result<T> Failure(string error) => new(default, false, new[] { error });

    /// <summary>
    /// Creates a failed result with multiple error messages.
    /// </summary>
    public new static Result<T> Failure(IEnumerable<string> errors) => new(default, false, errors.ToList());

    /// <summary>
    /// Implicit conversion from T to Result{T} (success case).
    /// </summary>
    public static implicit operator Result<T>(T value) => Success(value);
}

