import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { addQuestionSchema } from '../../utils/validationSchemas';
import { createQuestion } from '../../features/questions/questionSlice';
import topicService from '../../services/topicService';

export default function AddQuestionModal({ open, onClose, defaultModule }) {
  const dispatch = useDispatch();
  const { mutationStatus } = useSelector((state) => state.questions);
  const [topicOptions, setTopicOptions] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addQuestionSchema),
    defaultValues: {
      title: '',
      description: '',
      module: defaultModule,
      topicId: '',
      difficulty: 'Medium',
      expectedTime: 30,
      hints: '',
      solutionNotes: '',
      tags: '',
    },
  });

  const selectedModule = watch('module');

  // "Topic: only show topics belonging to the selected module" — fetched
  // independently of whatever the page behind this modal happens to have
  // loaded, so switching the module inside the form always shows the right
  // topics, even for a module the page itself hasn't fetched.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setTopicsLoading(true);
    topicService
      .getTopics({ module: selectedModule })
      .then(({ topics }) => {
        if (!cancelled) setTopicOptions(topics);
      })
      .finally(() => {
        if (!cancelled) setTopicsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, selectedModule]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      hints: values.hints ? values.hints.split('\n').map((h) => h.trim()).filter(Boolean) : [],
      tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };
    const result = await dispatch(createQuestion(payload));
    if (createQuestion.fulfilled.match(result)) {
      toast.success(`"${values.title}" added`);
      reset({
        title: '',
        description: '',
        module: defaultModule,
        topicId: '',
        difficulty: 'Medium',
        expectedTime: 30,
        hints: '',
        solutionNotes: '',
        tags: '',
      });
      onClose();
    } else {
      toast.error(result.payload || 'Could not add question');
    }
  };

  return (
    <Modal open={open} title="Add question" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1" noValidate>
        <Input label="Title" placeholder="Design a URL Shortener" error={errors.title?.message} {...register('title')} />
        <Textarea label="Description" error={errors.description?.message} {...register('description')} />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Module" error={errors.module?.message} {...register('module')}>
            <option value="lld">LLD</option>
            <option value="hld">HLD</option>
          </Select>
          <Select
            label="Topic"
            error={errors.topicId?.message}
            hint={topicsLoading ? 'Loading topics\u2026' : undefined}
            {...register('topicId')}
          >
            <option value="">Select a topic</option>
            {topicOptions.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Difficulty" error={errors.difficulty?.message} {...register('difficulty')}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </Select>
          <Input
            label="Expected time (min)"
            type="number"
            min={5}
            max={240}
            error={errors.expectedTime?.message}
            {...register('expectedTime')}
          />
        </div>

        <Textarea
          label="Hints"
          hint="One hint per line."
          rows={3}
          error={errors.hints?.message}
          {...register('hints')}
        />
        <Textarea label="Solution notes" error={errors.solutionNotes?.message} {...register('solutionNotes')} />
        <Input label="Tags" hint="Comma-separated." placeholder="strategy, allocation" error={errors.tags?.message} {...register('tags')} />

        <Button type="submit" className="mt-1 w-full" loading={mutationStatus === 'loading'}>
          Add question
        </Button>
      </form>
    </Modal>
  );
}
