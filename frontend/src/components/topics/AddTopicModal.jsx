import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { addTopicSchema } from '../../utils/validationSchemas';
import { createTopic } from '../../features/topics/topicSlice';

export default function AddTopicModal({ open, onClose, defaultModule }) {
  const dispatch = useDispatch();
  const { mutationStatus } = useSelector((state) => state.topics);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addTopicSchema),
    defaultValues: { name: '', description: '', category: '', difficulty: 'Medium', module: defaultModule },
  });

  const onSubmit = async (values) => {
    const result = await dispatch(createTopic(values));
    if (createTopic.fulfilled.match(result)) {
      toast.success(`"${values.name}" added`);
      reset({ name: '', description: '', category: '', difficulty: 'Medium', module: defaultModule });
      onClose();
    } else {
      toast.error(result.payload || 'Could not add topic');
    }
  };

  return (
    <Modal open={open} title="Add topic" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input label="Topic name" placeholder="System Design Basics" error={errors.name?.message} {...register('name')} />
        <Textarea
          label="Description"
          placeholder="Fundamental concepts of distributed systems."
          error={errors.description?.message}
          {...register('description')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Category" placeholder="Distributed Systems" error={errors.category?.message} {...register('category')} />
          <Select label="Difficulty" error={errors.difficulty?.message} {...register('difficulty')}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </Select>
        </div>
        <Select label="Module" error={errors.module?.message} {...register('module')}>
          <option value="lld">LLD</option>
          <option value="hld">HLD</option>
        </Select>
        <Button type="submit" className="mt-1 w-full" loading={mutationStatus === 'loading'}>
          Add topic
        </Button>
      </form>
    </Modal>
  );
}
