import { ethers } from 'hardhat';

async function main() {
  const [principal] = await ethers.getSigners();

  const contractAddress = '0x3F6eb5Eb91424b68e10cEFA5ccBfCA8871Fc1d3f';

  const schMgt = await ethers.getContractAt('SchMgt', contractAddress);

  console.log('Contract deployed to:', contractAddress);
  console.log('Principal address:', principal.address);

  try {
    const initialCount = await schMgt.studentCount();
    console.log('Initial student count:', initialCount.toString());

    console.log('\nRegistering student...');
    const tx = await schMgt.registerStudent('John Doe', 18, 0); // 0 = male
    await tx.wait();
    console.log('Student registered successfully!');

    const newCount = await schMgt.studentCount();
    console.log('New student count:', newCount.toString());

    const student = await schMgt.students(0);
    console.log('\nStudent details:');
    console.log('Name:', student.name);
    console.log('Age:', student.age);
    console.log('Grade:', student.grade);
    console.log('Gender:', student.gender);
    console.log('Status:', student.status);

    console.log('\nRegistering another student...');
    const tx2 = await schMgt.registerStudent('Jane Smith', 17, 1);
    await tx2.wait();
    console.log('Second student registered successfully!');

    console.log('\nGetting all students...');
    const allStudents = await schMgt.getAllStudents();
    console.log('Total students:', allStudents.length);

    allStudents.forEach((student: any, index: number) => {
      console.log(`\nStudent ${index}:`);
      console.log('Name:', student.name);
      console.log('Age:', student.age);
      console.log('Grade:', student.grade);
      console.log('Gender:', student.gender);
      console.log('Status:', student.status);
    });
  } catch (error: any) {
    console.error('Error interacting with contract:', error.message);
    if (error.reason) {
      console.error('Revert reason:', error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
