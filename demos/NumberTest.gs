#DOC# Test div, sub, sum, mul.
#DOC#
#DOC# This code is same to 3*{12/[1+(12-10)]/2}.
#DOC#
#DOC# Result is 6 (6.0).
print(mul(3,div(12,sum(1,sub(12,10)),2)))