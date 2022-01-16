terraform {
  cloud {
    organization = "davidbarratt"

    workspaces {
      name = "drupal-edge"
    }
  }
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 3.0"
    }
  }
}

provider "cloudflare" {}

resource "cloudflare_worker_script" "drupal" {
  name    = "drupal"
  content = file("worker/script.js")
}
