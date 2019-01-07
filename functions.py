__author__ = 'Artgor'

import base64
import os
import uuid
import random
import numpy as np
import cv2
import boto
import boto3
from boto.s3.key import Key
from boto.s3.connection import S3Connection
from codecs import open
from PIL import Image
from scipy.ndimage.interpolation import rotate, shift
from skimage import transform
import torch.nn as nn
import torch.nn.functional as F
import torchvision
import torchvision.transforms as transforms
import torch.optim as optim
from torch.autograd import Variable
import torch
# from two_layer_net import FNN
# from conv_net import CNN
from pytorch_net import Net
import matplotlib.pyplot as plt
import matplotlib.patches as patches

class Model(object):
    def __init__(self):
        """
        Load weights for FNN here. Original weights are loaded from local folder, updated - from Amazon.
        """
        # self.params_original = np.load('models/original_weights.npy')[()]
        # self.params = self.load_weights_amazon('updated_weights.npy')
        model_conv = Net()
        checkpoint = torch.load('models/model1.pt')
        # epoch = checkpoint['epoch']
        # state_dict = checkpoint['state_dict']
        # optimizer = checkpoint['optimizer']
        model_conv.load_state_dict(checkpoint['state_dict'])
        model_conv.eval()
        optimizer = optim.SGD(model_conv.parameters(), lr=0.1, momentum=0.9)
        optimizer.load_state_dict(checkpoint['optimizer'])
        self.model_conv = model_conv
        self.optimizer = optimizer

        self.loader = transforms.Compose([
            transforms.Resize((32, 32)),
            transforms.ToTensor(),
            transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
        ])

    def load_single_image(self, path: str, bbox=None):
        """Loads a single digit from file into Pytorch tensor."""
        img = Image.open(path).convert('RGB')

        if bbox == None:
            bbox = Image.eval(img, lambda px: 255 - px).getbbox()
        else:
            x, y, w, h = bbox
            bbox = (x, y, x + w, y + h)
        image = img.crop(bbox)
        image = self.loader(image).float()
        image = Variable(image, requires_grad=True)
        image = image.view(1, 3, 32, 32)

        return image

    def process_image(self, image):
        """
        Processing image for prediction. Saving in temproral folder so that it could be opened by PIL.
        """

        self.filename = 'digit' +  '__' + str(uuid.uuid1()) + '.jpg'
        path = 'tmp/' + self.filename
        with open(path, 'wb') as f:
            f.write(image)

        im = cv2.imread(path)

        im_gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
        im_gray = cv2.GaussianBlur(im_gray, (5, 5), 0)

        # Threshold the image
        ret, im_th = cv2.threshold(im_gray, 90, 255, cv2.THRESH_BINARY_INV)

        # Find contours in the image
        _, ctrs, hier = cv2.findContours(im_th.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Get rectangles contains each contour
        rects = [cv2.boundingRect(ctr) for ctr in ctrs]
        self.rects = rects



        if len(rects) > 1:
            imgs = [self.load_single_image(path, b) for b in rects]
            return imgs

        elif len(rects) == 1:
            img = self.load_single_image(path)
            return [img]

    def save_marked_image(self):
        image = cv2.imread('tmp/' + self.filename)
        fig, ax = plt.subplots(1)

        # Display the image
        ax.imshow(image)

        # Create a Rectangle patch
        for i, rect in enumerate(self.rects):
            x, y, w, h = rect
            rect = (x, y, x + w, y + h)
            # plt.imshow(cv2.rectangle(np.array(img),(rect[0],rect[1]),(rect[2],rect[3]),(0, 50* i,0),3))
            rect_ = patches.Rectangle((rect[0], rect[1]), rect[2] - rect[0], rect[3] - rect[1], linewidth=2,
                                      edgecolor='red', facecolor='none')
            plt.text(rect[2], rect[1], self.prediction[i], color='orange')
            # Add the patch to the Axes
            ax.add_patch(rect_)
        plt.axis('off')
        ax.grid(False)
        filename = 'static/marked' + '__' + str(uuid.uuid1()) + '.jpg'
        plt.savefig(filename)
        self.marked_image_name = filename

    def save_image(self, drawn_digit, image):
        """
        Save image on Amazon. Only existing files can be uploaded, so the image is saved in a temporary folder.
        """
        filename = 'digit' + str(drawn_digit) + '__' + str(uuid.uuid1()) + '.jpg'
        with open('tmp/' + filename, 'wb') as f:
            f.write(image)
        REGION_HOST = 's3-external-1.amazonaws.com'
        conn = S3Connection(os.environ['AWS_ACCESS_KEY_ID'], os.environ['AWS_SECRET_ACCESS_KEY'], host=REGION_HOST)
        bucket = conn.get_bucket('digitdrawpredict')
        k = Key(bucket)
        k.key = filename
        k.set_contents_from_filename('tmp/' + filename)
        return ('Image saved successfully with the name {0}'.format(filename))

    def predict(self, image):
        """
        Predicting image.
        """

        img_tensors = self.process_image(image)
        if img_tensors is None:
            return "Can't predict, when nothing is drawn"

        prediction = [self.model_conv(img).argmax().item() for img in img_tensors]
        prediction = [str(i) if i != 10 else '-' for i in prediction]
        self.prediction = prediction
        prediction = ' '.join([i for i in prediction])

        self.save_marked_image()

        answers_dict = {'answer': prediction, 'image': self.marked_image_name}
        self.save_image(prediction, image)

        return answers_dict
