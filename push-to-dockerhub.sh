#!/bin/bash
# ══════════════════════════════════════════════
#  ShopFlow - Docker Hub pe images push karo
#  Usage: ./push-to-dockerhub.sh YOUR_USERNAME
# ══════════════════════════════════════════════

DOCKERHUB_USER=${1:-"your-dockerhub-username"}
echo "Docker Hub User: $DOCKERHUB_USER"

echo ""
echo "Step 1: Maven build (sab services)"
echo "─────────────────────────────────"

for service in eureka-server api-gateway user-service product-service; do
  echo "Building $service..."
  cd $service
  mvn clean package -DskipTests -q
  cd ..
done

echo ""
echo "Step 2: Docker images build karo"
echo "─────────────────────────────────"
docker build -t $DOCKERHUB_USER/shopflow-eureka:latest   ./eureka-server
docker build -t $DOCKERHUB_USER/shopflow-gateway:latest  ./api-gateway
docker build -t $DOCKERHUB_USER/shopflow-user:latest     ./user-service
docker build -t $DOCKERHUB_USER/shopflow-product:latest  ./product-service
docker build -t $DOCKERHUB_USER/shopflow-frontend:latest ./frontend

echo ""
echo "Step 3: Docker Hub login"
docker login

echo ""
echo "Step 4: Images push karo"
echo "─────────────────────────────────"
docker push $DOCKERHUB_USER/shopflow-eureka:latest
docker push $DOCKERHUB_USER/shopflow-gateway:latest
docker push $DOCKERHUB_USER/shopflow-user:latest
docker push $DOCKERHUB_USER/shopflow-product:latest
docker push $DOCKERHUB_USER/shopflow-frontend:latest

echo ""
echo "✅ Sab images Docker Hub pe push ho gaye!"
echo "Ab k8s/deployment.yml mein YOUR_DOCKERHUB ko $DOCKERHUB_USER se replace karo"
echo "Phir: kubectl apply -f k8s/"
