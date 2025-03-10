from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.exceptions.validation_exceptions.base_exceptions import MathesarValidationException


class DistinctColumnRequiredAPIException(MathesarValidationException):
    error_code = ErrorCodes.DistinctColumnNameRequired.value

    def __init__(
            self,
            message="Column names must be distinct",
            field=None,
            details=None,
    ):
        super().__init__(None, self.error_code, message, field, details)


class ColumnSizeMismatchAPIException(MathesarValidationException):
    error_code = ErrorCodes.ColumnSizeMismatch.value

    def __init__(
            self,
            message="Incorrect number of columns in request.",
            field=None,
            details=None,
    ):
        super().__init__(None, self.error_code, message, field, details)


class MultipleDataFileAPIException(MathesarValidationException):
    error_code = ErrorCodes.MultipleDataFiles.value

    def __init__(
            self,
            message="Multiple data files are unsupported.",
            field=None,
            details=None,
    ):
        super().__init__(None, self.error_code, message, field, details)
