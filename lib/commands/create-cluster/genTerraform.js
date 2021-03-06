/* eslint-disable no-template-curly-in-string */
const _ = require('lodash'),
  GenesisDevice = require('genesis-device')
;

function genTerraform(clusterConfig) {
  const genesis = new GenesisDevice();

  genesis.addProvider('aws', {
    region: clusterConfig.region,
  }, [
    `Provider: AWS region "${clusterConfig.region}"`,
  ]);

  //
  // EC2 Security Group for the client tier.
  //
  genesis.addResource('aws_security_group', 'client_sg', {
    description: 'Inbound SSH+NTP, outbound all',
    name: 'client_sg',
    $inlines: [
      // Allow HTTPS egress for outgoing HTTPS calls.
      ['egress', {
        from_port: 0,
        to_port: 443,
        protocol: 'tcp',
        cidr_blocks: ['0.0.0.0/0'],
      }],

      // Allow HTTP egress too.
      ['egress', {
        from_port: 0,
        to_port: 80,
        protocol: 'tcp',
        cidr_blocks: ['0.0.0.0/0'],
      }],

      // Allow incoming SSH.
      ['ingress', {
        from_port: 0,
        to_port: 22,
        protocol: 'tcp',
        cidr_blocks: ['0.0.0.0/0'],
      }],

      // Allow incoming/outgoing NTP protocol
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
  });

  genesis.addData('aws_ami', 'ubuntu', {
    most_recent: true,
    owners: ['099720109477'], // Canonical
    $inlines: [
      ['filter', {
        name: 'name',
        values: [clusterConfig.baseAmiSearchTerm],
      }],
      ['filter', {
        name: 'virtualization-type',
        values: ['hvm'],
      }],
    ],
  });

  genesis.addResource('aws_key_pair', 'benchoid_keypair', {
    key_name: 'benchoid_keypair',
    public_key: clusterConfig.sshPubKey,
  }, [
    'SSH public key',
  ]);

  genesis.addResource('aws_instance', 'client_tier', {
    count: clusterConfig.instanceCount,
    availability_zone: clusterConfig.az,
    instance_type: clusterConfig.instanceType,
    ami: '${data.aws_ami.ubuntu.id}',
    key_name: '${aws_key_pair.benchoid_keypair.id}',
    associate_public_ip_address: true,
    vpc_security_group_ids: ['${aws_security_group.client_sg.id}'],
    $inlines: [
      // Gets mounted at /mnt
      ['ephemeral_block_device', {
        device_name: '/dev/xvdl',
        virtual_name: 'ephemeral0',
      }],
    ],
  }, [
    'Client tier',
  ]);

  _.forEach(_.range(0, clusterConfig.instanceCount), (idx) => {
    const outputName = `client-tier-ip-${idx}`;
    genesis.addOutput(outputName, {
      value: `\${aws_instance.client_tier.${idx}.public_ip}`,
    });
  });

  genesis.addOutput('instance-type', {
    value: clusterConfig.instanceType,
  });

  genesis.addOutput('instance-count', {
    value: clusterConfig.instanceCount,
  });

  return genesis.toString();
}

module.exports = genTerraform;
