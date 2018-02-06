# Benchoid

## Linux based cloud benchmarking tool.

Benchoid allows distributed load testing of WebSocket and HTTP endpoints. 

## Installation

Benchoid experiments are designed to run from a single controller node,
usually the developer's workstation or laptop. 

### Pre-requisites
 
  1. **Terraform**: open-source cloud infrastructure management software from
     Hashicorp. Terraform is distributed as a single binary file, and must be installed
     in the system path via the `terraform` command. Terraform version **0.11.3** 
     or higher is required. Download Terraform from [the terraform.io download page](https://www.terraform.io/downloads.html).

  2. **AWS account**: AWS credentials must be configured in a place that the AWS SDK
     can find them in. Usually, this is in `~/.aws/credentials` or via environment variables.
     The following API key permissions are required:
    
     1.  `EC2FullAccess` to create and destroy clusters of client instances.

  3. **OpenSSH**: or compatible SSH suite installed on the controller node. This means a 
     public key in `~/.ssh/id-rsa.pub`, and the commands `ssh` and `rsync` in the system
     path, expecting OpenSSH-compatible command-line syntax.

  4. **R** *(optional)*: open-source statistics software for analyzing experiment results
     and plotting the results of benchmark analyses. Download R from the [R Project for Statistical Computing](https://www.r-project.org/). R is only required on the controller node.

### Install via `npm`

    npm install benchoid


## Workflow

### 

### Create a load generating cluster

### 