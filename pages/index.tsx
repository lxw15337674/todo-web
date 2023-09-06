import { useSession } from 'next-auth/react';
import Layout from '../components/layout';
import Card from 'components/Card';
import { Button, Input } from 'antd';
import { Task } from 'api/interface';
import { useObject, usePromise } from 'wwhooks';
import { createTask } from 'api/task';
export default function IndexPage() {
  const [newTask, setNewTask] = useObject<Task>({
    title: '',
  });

  const { run } = usePromise(createTask);

  return (
    <Layout>
      <div className="m-3">
        <div className="border mb-4">
          <div className="p-[4px]">
            <Input
              value={newTask.title}
              onChange={(e) => {
                setNewTask({ title: e.target.value });
              }}
              bordered={false}
              onPressEnter={() => {
                console.log('test');
                run(newTask);
              }}
            />
          </div>
          <div className="border-t  p-[6px] bg-hover flex">
            <Button
              size="small"
              className="ml-auto px-[15px] py-[2px] h-auto"
              onClick={() => {
                run(newTask);
              }}
            >
              发送
            </Button>
          </div>
        </div>
        <Card>123</Card>
      </div>
    </Layout>
  );
}
