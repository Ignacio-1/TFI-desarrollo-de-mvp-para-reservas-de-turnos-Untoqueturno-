variable "environment" {
  description = "El ambiente de despliegue (dev, qa, prod)"
  type        = string
}

variable "aws_region" {
  description = "Región de AWS donde se despliegan los servidores"
  type        = string
  default     = "us-east-1"
}

variable "redis_node_type" {
  description = "Tamaño del servidor de memoria Redis"
  type        = string
}

variable "redis_replicas" {
  description = "Cantidad de réplicas de caché para Alta Disponibilidad"
  type        = number
}

variable "rmq_instance_type" {
  description = "Tamaño del servidor de RabbitMQ"
  type        = string
}
