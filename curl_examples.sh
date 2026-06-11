#!/bin/bash

# Ensure Docker images are built before testing
# docker build -t codebattle-python ./docker/images/python
# docker build -t codebattle-node ./docker/images/node
# docker build -t codebattle-java ./docker/images/java

echo "Testing Health..."
curl -X GET http://localhost:3000/health
echo -e "\n"

echo "Testing Ready..."
curl -X GET http://localhost:3000/ready
echo -e "\n"

echo "Testing Version..."
curl -X GET http://localhost:3000/version
echo -e "\n"

echo "Testing Python Execution..."
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "sourceCode": "print(\"Hello from Python!\")"
  }'
echo -e "\n"

echo "Testing Node.js Execution..."
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "javascript",
    "sourceCode": "console.log(\"Hello from Node.js!\");"
  }'
echo -e "\n"

echo "Testing Java Execution..."
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "java",
    "sourceCode": "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello from Java!\");\n  }\n}"
  }'
echo -e "\n"

echo "Testing Time Limit Exceeded (Python)..."
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "sourceCode": "import time\nwhile True:\n    time.sleep(1)"
  }'
echo -e "\n"
