provider "aws" {
  region = var.aws_region
}

# 1. Clúster de Kubernetes (Microservicios)
resource "aws_eks_cluster" "untoqueturno_cluster" {
  name     = "untoqueturno-${var.environment}-cluster"
  role_arn = "arn:aws:iam::123456789012:role/FakeEKSRoleForTFI"

  vpc_config {
    subnet_ids = ["subnet-12345", "subnet-67890"]
  }
}

# 2. Base de Datos en Memoria (Caché Redis Alta Disponibilidad)
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "untoqueturno-${var.environment}-redis"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_replicas
  parameter_group_name = "default.redis7"
  port                 = 6379
}

# 3. Bus de Eventos Asíncronos (RabbitMQ Gestionado)
resource "aws_mq_broker" "rabbitmq" {
  broker_name        = "untoqueturno-${var.environment}-rabbitmq"
  engine_type        = "RabbitMQ"
  engine_version     = "3.11.20"
  host_instance_type = var.rmq_instance_type

  user {
    username = "admin"
    password = "SuperSecretPassword123!"
  }
}
