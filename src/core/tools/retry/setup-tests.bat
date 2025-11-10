@echo off
cd src
mkdir -p src\core\tools\retry\tests
copy src\core\tools\retry\__tests__\EnhancedRetryManager.test.ts src\core\tools\retry\tests\EnhancedRetryManager.test.ts
echo Tests directory created and files copied successfully