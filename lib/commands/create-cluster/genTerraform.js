/* eslint-disable no-template-curly-in-string */
const _ = require('lodash')
const GenesisDevice = require('genesis-device')

function genTerraform(clusterConfig) {
  const genesis = new GenesisDevice()

  genesis.addProvider('aws', {
    region: clusterConfig.region,
  }, [
    `Provider: AWS region "${clusterConfig.region}"`,
  ])

  //
  // EC2 Security Group for the client tier.
  //
  genesis.addResource('aws_security_group', 'client_sg', {
    description: 'Inbound SSH, outbound HTTP(s), both NTP',
    name: 'client_sg',
    $inlines: [
      // Allow HTTPS egress for outgoing HTTPS connections.
      ['egress', {
        from_port: 0,
        to_port: 443,
        protocol: 'tcp',
        cidr_blocks: ['0.0.0.0/0'],
      }],

      // Allow HTTP egress for outgoing HTTP connections.
      ['egress', {
        from_port: 0,
        to_port: 80,
        protocol: 'tcp',
        cidr_blocks: ['0.0.0.0/0'],
      }],

      // Allow incoming SSH connections.
      ['ingress', {
        from_port: 0,
        to_port: 22,
        protocol: 'tcp',
        cidr_blocks: ['0.0.0.0/0'],
      }],

      // Allow incoming/outgoing NTP protocol.
      ['egress', {
        from_port: 0,
        to_port: 123,
        protocol: 'udp',
        cidr_blocks: ['0.0.0.0/0'],
      }],

      ['ingress', {
        from_port: 0,
        to_port: 123,
        protocol: 'udp',
        cidr_blocks: ['0.0.0.0/0'],
      }],
    ],
  })

  //
  // AMI search.
  //
  genesis.addData('aws_ami', 'ubuntu', {
    most_recent: true,
    owners: [clusterConfig.amiOwnerAccount],
    $inlines: [
      ['filter', {
        name: 'name',
        values: [clusterConfig.amiSearchTerm],
      }],
      ['filter', {
        name: 'virtualization-type',
        values: ['hvm'],
      }],
    ],
  })

  //
  // SSH public key.
  //
  genesis.addResource('aws_key_pair', 'benchoid_keypair', {
    key_name: 'benchoid_keypair',
    public_key: clusterConfig.sshPubKey,
  }, [
    'SSH public key',
  ])

  //
  // EC2 instances.
  //
  genesis.addResource('aws_instance', 'client_tier', {
    count: clusterConfig.instances,
    // availability_zone: clusterConfig.az,
    instance_type: clusterConfig.instanceType,
    ami: '${data.aws_ami.ubuntu.id}',
    key_name: '${aws_key_pair.benchoid_keypair.id}',
    associate_public_ip_address: true,
    vpc_security_group_ids: ['${aws_security_group.client_sg.id}']
  }, [
    'Client tier',
  ])

  genesis.addOutput('client_tier_ip', {
    value: '\${aws_instance.client_tier.*.public_ip}',
  })

  genesis.addOutput('instance-type', {
    value: `${clusterConfig.instanceType}`
  })

  return genesis.toString()
}

module.exports = genTerraform
