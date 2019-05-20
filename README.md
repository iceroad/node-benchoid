# Benchoid: a cloud benchmarking framework

Benchoid is an agent-based framework for distributed load testing of any type of server software.
It works by remotely orchestrating `ssh`-accessible VMs running an increasing number of load-generating
_agents_ (simulated users), and collecting aggregated metrics from each agent over time. A benchoid
**experiment** runs for a fixed duration, steadily increasing load on the target and measuring changes
in its observed behavior.

Benchoid is a convention-over-configuration pipeline for provisioning cloud infrastructure, setting it up,
running various distributed load tests and collecting results locally, analyzing and reporting on the results,
and then tearing down infrastructure when done (via Terraform). It is designed to be run from a single
master orchestrator node that must be available for the duration of an experiment.

## Install

### Pre-requisites

1. **Terraform**: open-source cloud infrastructure management software from
   Hashicorp. Terraform is distributed as a single binary file, and must be installed
   in the system path via the `terraform` command. Terraform version **0.11.3**
   or higher is required. Download Terraform from [the terraform.io download page](https://www.terraform.io/downloads.html).

2. **OpenSSH**: or compatible SSH suite installed on the controller node. This means a
   public key in `~/.ssh/id-rsa.pub`, and the commands `ssh` and `rsync` are in the system
   path, expecting OpenSSH-compatible command-line syntax.

### Install via `npm`

    npm install -g benchoid

## Workflow

### Write agents

1.  Create a new project:

        benchoid new-project some-project-name
        cd some-project-name

2.  Edit the file `agent/agent.js` to program your load generating agent's behavior. `npm install` can be used to
    install dependencies into `package.json` in the project directory.

3.  If the agent can be tested locally, run the following command to spin up a single agent for 10 seconds and inspect its raw output.

        benchoid test-agent

### Create client (load-generating) VMs

1.  Edit the Terraform project in `terraform/client` to provision a cluster of client VMs. Run `terraform init`,
    `terraform plan`, and `terraform apply` in this directory as necessary. Running `terraform output` in this
    directory should include the following outputs:

    a. `client_vm_ips`: array of IPs of VMs

    b. `ssh_username`: SSH username

    c. `ssh_private_key`: SSH private key

2.  Edit the client tier setup script in `setup/client` to set up an individual VM with any required OS packages.
    Node.js must be installed as part of this client script. The client script will vary by OS. Test the client setup
    script by copying it to a single remote VM and executing it.

        benchoid test-client-setup

3.  Execute the client tier setup script on all remote VMs.

        benchoid client-setup

4.  Synchronize your agent source directory and `package.json` file to remote VMs and run `npm install`

        benchoid sync

### Run experiments

1.  Run a new experiment by entering experiment parameters interactively. Experimental data will be written to a
    `benchoid_state` subdirectory that will be created in the working directory.

         benchoid new-experiment

2.  Run multiple experiments with different parameters, as long as they have different experiment IDs.

### Analyze data

1.  Write an **aggregator** by creating a Node module with the prefix `analysis-` in the `analysis/` directory.
    An aggregator is passed all experimental data received from all agents on all VMs, and generates an analysis
    of its choice (e.g., statistics, group-bys, filtering).

2.  Run all experimental data for one or all experiments through all aggregators.

        benchoid analyze

### Teardown client VMs

1. Run `terraform destroy` in the `terraform/client` directory.

2. Optionally delete your project directory.
